const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../../config/database");
const {
  jwtSecret,
  jwtExpiresIn,
  saltRounds,
  refreshTokenExpiresInDays,
  invitationExpiresInDays,
} = require("../../config/auth");
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require("../../shared/utils/errors");
const { eventBus } = require("../../shared/services/event-bus");
const { validateVerificationToken } = require("../../shared/services/otp");

function generateTokenPair(user) {
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const db = getDb();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresInDays);

  db.prepare(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
  ).run(user.id, refreshToken, expiresAt.toISOString());

  return { accessToken, refreshToken };
}

async function register({ verificationToken, password, firstName, lastName, role }) {
  const db = getDb();

  // Validate the email verification token
  const { email } = validateVerificationToken(verificationToken, "registration");

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const userRole = role || "client";
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const result = db
    .prepare(
      "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)"
    )
    .run(email, passwordHash, firstName, lastName, userRole);

  const user = db
    .prepare(
      "SELECT id, email, first_name, last_name, role, trainer_id, created_at FROM users WHERE id = ?"
    )
    .get(result.lastInsertRowid);

  const tokens = generateTokenPair(user);

  await eventBus.emit("user.registered", { user });

  return { user, token: tokens.accessToken, refreshToken: tokens.refreshToken };
}

async function login({ email, password }) {
  const db = getDb();

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ForbiddenError("Account is not active");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = generateTokenPair(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      trainer_id: user.trainer_id || null,
    },
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function refresh({ refreshToken }) {
  const db = getDb();

  const stored = db
    .prepare("SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0")
    .get(refreshToken);

  if (!stored) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (new Date(stored.expires_at) < new Date()) {
    db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?").run(stored.id);
    throw new UnauthorizedError("Refresh token expired");
  }

  // Revoke the old refresh token (rotation)
  db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?").run(stored.id);

  const user = db
    .prepare(
      "SELECT id, email, first_name, last_name, role, trainer_id, created_at FROM users WHERE id = ?"
    )
    .get(stored.user_id);

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const tokens = generateTokenPair(user);
  return { user, token: tokens.accessToken, refreshToken: tokens.refreshToken };
}

async function logout({ refreshToken }) {
  const db = getDb();
  db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?").run(refreshToken);
}

async function createInvitation({ email, role, invitedBy }) {
  const db = getDb();

  const existing = db
    .prepare("SELECT id, role, trainer_id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    // If the user already exists and is a client, auto-create a trainer request
    if (existing.role === "client") {
      if (existing.trainer_id === invitedBy) {
        throw new ConflictError("This user is already your client");
      }
      // Check for existing pending request
      const pendingReq = db
        .prepare(
          "SELECT id FROM trainer_requests WHERE trainer_id = ? AND client_id = ? AND status = 'pending'"
        )
        .get(invitedBy, existing.id);
      if (pendingReq) {
        throw new ConflictError(
          "A trainer request is already pending for this client"
        );
      }
      // Create or re-send trainer request
      const existingReq = db
        .prepare(
          "SELECT id FROM trainer_requests WHERE trainer_id = ? AND client_id = ?"
        )
        .get(invitedBy, existing.id);
      if (existingReq) {
        db.prepare(
          "UPDATE trainer_requests SET status = 'pending', created_at = datetime('now'), responded_at = NULL WHERE id = ?"
        ).run(existingReq.id);
      } else {
        db.prepare(
          "INSERT INTO trainer_requests (trainer_id, client_id) VALUES (?, ?)"
        ).run(invitedBy, existing.id);
      }
      await eventBus.emit("trainer.request.sent", {
        trainerId: invitedBy,
        clientId: existing.id,
      });
      return {
        type: "trainer_request",
        message:
          "This user already has an account. A trainer request has been sent — they can approve it from their dashboard.",
        clientId: existing.id,
      };
    }
    throw new ConflictError("User with this email already exists");
  }

  const pending = db
    .prepare(
      "SELECT id FROM invitations WHERE email = ? AND status = 'pending' AND expires_at > datetime('now')"
    )
    .get(email);
  if (pending) {
    throw new ConflictError("Active invitation already exists for this email");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + invitationExpiresInDays);

  const result = db
    .prepare(
      "INSERT INTO invitations (email, role, invited_by, token, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(email, role || "client", invitedBy, token, expiresAt.toISOString());

  const invitation = db
    .prepare("SELECT * FROM invitations WHERE id = ?")
    .get(result.lastInsertRowid);

  // Send OTP to the invited email
  const { sendOTP } = require("../../shared/services/otp");
  await sendOTP(email, "invitation");

  await eventBus.emit("invitation.created", { invitation });

  return invitation;
}

async function acceptInvitation({ verificationToken, password, firstName, lastName }) {
  const db = getDb();

  // Validate the email verification token
  const { email } = validateVerificationToken(verificationToken, "invitation");

  // Find the pending invitation for this email
  const invitation = db
    .prepare("SELECT * FROM invitations WHERE email = ? AND status = 'pending'")
    .get(email);

  if (!invitation) {
    throw new NotFoundError("Invitation");
  }

  if (new Date(invitation.expires_at) < new Date()) {
    db.prepare("UPDATE invitations SET status = 'expired' WHERE id = ?").run(
      invitation.id
    );
    throw new ValidationError("Invitation has expired");
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const trainerId = invitation.role === "client" ? invitation.invited_by : null;

  const result = db
    .prepare(
      "INSERT INTO users (email, password_hash, first_name, last_name, role, trainer_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      invitation.email,
      passwordHash,
      firstName,
      lastName,
      invitation.role,
      trainerId
    );

  db.prepare("UPDATE invitations SET status = 'accepted' WHERE id = ?").run(
    invitation.id
  );

  const user = db
    .prepare(
      "SELECT id, email, first_name, last_name, role, trainer_id, created_at FROM users WHERE id = ?"
    )
    .get(result.lastInsertRowid);

  const tokens = generateTokenPair(user);

  await eventBus.emit("user.registered", { user, invitation });

  return { user, token: tokens.accessToken, refreshToken: tokens.refreshToken };
}

function listInvitations(invitedBy) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM invitations WHERE invited_by = ? ORDER BY created_at DESC")
    .all(invitedBy);
}

function revokeInvitation(id, userId) {
  const db = getDb();
  const invitation = db
    .prepare("SELECT * FROM invitations WHERE id = ? AND invited_by = ?")
    .get(id, userId);

  if (!invitation) {
    throw new NotFoundError("Invitation");
  }

  if (invitation.status !== "pending") {
    throw new ValidationError("Can only revoke pending invitations");
  }

  db.prepare("UPDATE invitations SET status = 'revoked' WHERE id = ?").run(id);
  return { ...invitation, status: "revoked" };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  createInvitation,
  acceptInvitation,
  listInvitations,
  revokeInvitation,
};
