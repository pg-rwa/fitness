const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getDb } = require("../../config/database");
const { jwtSecret } = require("../../config/auth");
const { sendEmail, otpEmail } = require("./email");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const VERIFICATION_TOKEN_EXPIRY = "15m";

// Fixed code for test environment so tests can verify OTP without email
const TEST_OTP_CODE = "123456";

/**
 * Generate a numeric OTP code.
 */
function generateCode() {
  if (process.env.NODE_ENV === "test") return TEST_OTP_CODE;
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Create and store an OTP, then send it via email.
 * Invalidates any previous unused OTPs for the same email+type.
 * @param {string} email
 * @param {string} type - 'registration' | 'invitation'
 * @returns {{ message: string }}
 */
async function sendOTP(email, type = "registration") {
  const db = getDb();
  const code = generateCode();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // Invalidate previous unused OTPs for this email+type
  db.prepare(
    "DELETE FROM otp_codes WHERE email = ? AND type = ? AND verified_at IS NULL"
  ).run(email, type);

  db.prepare(
    "INSERT INTO otp_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)"
  ).run(email, code, type, expiresAt.toISOString());

  // Send the OTP email using styled template
  let emailFailed = false;
  try {
    const emailResult = await otpEmail(email, code);
    if (!emailResult) {
      emailFailed = true;
    }
  } catch (emailErr) {
    emailFailed = true;
  }

  // If email delivery fails, return the code directly so registration can proceed
  if (emailFailed) {
    return {
      message: "Email delivery failed. Use the code shown below.",
      code,
      devMode: true,
    };
  }

  return { message: "Verification code sent to your email" };
}

/**
 * Verify an OTP code and return a short-lived verification token.
 * @param {string} email
 * @param {string} code
 * @param {string} type - 'registration' | 'invitation'
 * @returns {{ verificationToken: string }}
 */
function verifyOTP(email, code, type = "registration") {
  const db = getDb();

  const otp = db
    .prepare(
      "SELECT * FROM otp_codes WHERE email = ? AND type = ? AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1"
    )
    .get(email, type);

  if (!otp) {
    throw Object.assign(new Error("No verification code found. Please request a new one."), { status: 400 });
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    db.prepare("DELETE FROM otp_codes WHERE id = ?").run(otp.id);
    throw Object.assign(new Error("Too many attempts. Please request a new code."), { status: 429 });
  }

  if (new Date(otp.expires_at) < new Date()) {
    db.prepare("DELETE FROM otp_codes WHERE id = ?").run(otp.id);
    throw Object.assign(new Error("Verification code has expired. Please request a new one."), { status: 400 });
  }

  // Increment attempts
  db.prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?").run(otp.id);

  if (otp.code !== code) {
    const remaining = OTP_MAX_ATTEMPTS - otp.attempts - 1;
    throw Object.assign(
      new Error(`Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`),
      { status: 400 }
    );
  }

  // Mark as verified
  db.prepare("UPDATE otp_codes SET verified_at = datetime('now') WHERE id = ?").run(otp.id);

  // Issue a short-lived verification token (JWT)
  const verificationToken = jwt.sign(
    { email, type, purpose: "email_verification" },
    jwtSecret,
    { expiresIn: VERIFICATION_TOKEN_EXPIRY }
  );

  return { verificationToken };
}

/**
 * Validate a verification token and extract the email.
 * @param {string} token
 * @param {string} expectedType - 'registration' | 'invitation'
 * @returns {{ email: string }}
 */
function validateVerificationToken(token, expectedType) {
  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.purpose !== "email_verification") {
      throw new Error("Invalid token purpose");
    }
    if (payload.type !== expectedType) {
      throw new Error("Token type mismatch");
    }
    return { email: payload.email };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw Object.assign(new Error("Verification expired. Please verify your email again."), { status: 400 });
    }
    throw Object.assign(new Error("Invalid verification token. Please verify your email again."), { status: 400 });
  }
}

module.exports = {
  sendOTP,
  verifyOTP,
  validateVerificationToken,
};
