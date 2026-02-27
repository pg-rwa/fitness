const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError, ConflictError } = require("../../shared/utils/errors");
const { eventBus } = require("../../shared/services/event-bus");

function getProfile(req, res, next) {
  try {
    const db = getDb();
    const user = db
      .prepare(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.trainer_id, u.created_at,
                t.first_name || ' ' || t.last_name as trainer_name, t.email as trainer_email
         FROM users u
         LEFT JOIN users t ON t.id = u.trainer_id
         WHERE u.id = ?`
      )
      .get(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = db
      .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
      .get(req.userId);

    res.json({ ...user, profile: profile || null });
  } catch (err) {
    next(err);
  }
}

function updateProfile(req, res, next) {
  try {
    const db = getDb();
    const { heightCm, weightKg, dateOfBirth, gender, fitnessLevel } = req.body;

    const existing = db
      .prepare("SELECT id FROM user_profiles WHERE user_id = ?")
      .get(req.userId);

    if (existing) {
      const fields = [];
      const values = [];
      if (heightCm !== undefined) {
        fields.push("height_cm = ?");
        values.push(heightCm);
      }
      if (weightKg !== undefined) {
        fields.push("weight_kg = ?");
        values.push(weightKg);
      }
      if (dateOfBirth !== undefined) {
        fields.push("date_of_birth = ?");
        values.push(dateOfBirth);
      }
      if (gender !== undefined) {
        fields.push("gender = ?");
        values.push(gender);
      }
      if (fitnessLevel !== undefined) {
        fields.push("fitness_level = ?");
        values.push(fitnessLevel);
      }
      fields.push("updated_at = datetime('now')");
      values.push(req.userId);

      db.prepare(
        `UPDATE user_profiles SET ${fields.join(", ")} WHERE user_id = ?`
      ).run(...values);
    } else {
      db.prepare(
        "INSERT INTO user_profiles (user_id, height_cm, weight_kg, date_of_birth, gender, fitness_level) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(
        req.userId,
        heightCm || null,
        weightKg || null,
        dateOfBirth || null,
        gender || null,
        fitnessLevel || "beginner"
      );
    }

    const profile = db
      .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
      .get(req.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

// ─── Trainer's Client List ──────────────────────────────────

function myClients(req, res, next) {
  try {
    const db = getDb();
    const clients = db
      .prepare(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at,
                up.height_cm, up.weight_kg, up.fitness_level
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE u.trainer_id = ? AND u.role = 'client'
         ORDER BY u.first_name, u.last_name`
      )
      .all(req.userId);
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

// ─── Search Clients by Email ────────────────────────────────

function searchClients(req, res, next) {
  try {
    const db = getDb();
    const { email } = req.query;
    if (!email || email.length < 3) {
      return res.json([]);
    }

    const clients = db
      .prepare(
        `SELECT id, email, first_name, last_name, role, trainer_id
         FROM users
         WHERE role = 'client' AND email LIKE ? AND id != ?
         LIMIT 10`
      )
      .all(`%${email}%`, req.userId);

    // Don't reveal full details, just enough to identify
    const results = clients.map((c) => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      has_trainer: !!c.trainer_id,
      is_my_client: c.trainer_id === req.userId,
    }));

    res.json(results);
  } catch (err) {
    next(err);
  }
}

// ─── Trainer Requests ───────────────────────────────────────

async function sendTrainerRequest(req, res, next) {
  try {
    const db = getDb();
    const { clientId } = req.body;

    const client = db.prepare("SELECT id, email, first_name, last_name, role, trainer_id FROM users WHERE id = ?").get(clientId);
    if (!client) throw new NotFoundError("Client");
    if (client.role !== "client") {
      return res.status(400).json({ error: "Can only send requests to clients" });
    }
    if (client.trainer_id === req.userId) {
      return res.status(400).json({ error: "Already your client" });
    }

    // Check for existing pending request
    const existing = db
      .prepare("SELECT id, status FROM trainer_requests WHERE trainer_id = ? AND client_id = ?")
      .get(req.userId, clientId);

    if (existing && existing.status === "pending") {
      return res.status(409).json({ error: "Request already pending" });
    }

    if (existing) {
      // Re-send (update existing declined/expired)
      db.prepare("UPDATE trainer_requests SET status = 'pending', created_at = datetime('now'), responded_at = NULL WHERE id = ?")
        .run(existing.id);
    } else {
      db.prepare("INSERT INTO trainer_requests (trainer_id, client_id) VALUES (?, ?)")
        .run(req.userId, clientId);
    }

    const request = db
      .prepare(
        `SELECT tr.*, u.first_name || ' ' || u.last_name as client_name, u.email as client_email
         FROM trainer_requests tr
         JOIN users u ON u.id = tr.client_id
         WHERE tr.trainer_id = ? AND tr.client_id = ?`
      )
      .get(req.userId, clientId);

    // Notify client
    const trainer = db.prepare("SELECT first_name, last_name FROM users WHERE id = ?").get(req.userId);
    await eventBus.emit("trainer.request.sent", {
      request,
      trainerId: req.userId,
      trainerName: `${trainer.first_name} ${trainer.last_name}`,
      clientId,
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

function listTrainerRequests(req, res, next) {
  try {
    const db = getDb();
    const requests = db
      .prepare(
        `SELECT tr.*, u.first_name || ' ' || u.last_name as client_name, u.email as client_email
         FROM trainer_requests tr
         JOIN users u ON u.id = tr.client_id
         WHERE tr.trainer_id = ?
         ORDER BY tr.created_at DESC`
      )
      .all(req.userId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

function listClientRequests(req, res, next) {
  try {
    const db = getDb();
    const requests = db
      .prepare(
        `SELECT tr.*, u.first_name || ' ' || u.last_name as trainer_name, u.email as trainer_email
         FROM trainer_requests tr
         JOIN users u ON u.id = tr.trainer_id
         WHERE tr.client_id = ? AND tr.status = 'pending'
         ORDER BY tr.created_at DESC`
      )
      .all(req.userId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function respondToRequest(req, res, next) {
  try {
    const db = getDb();
    const requestId = parseInt(req.params.id, 10);
    const { action } = req.body; // "approve" or "decline"

    const request = db.prepare("SELECT * FROM trainer_requests WHERE id = ?").get(requestId);
    if (!request) throw new NotFoundError("Trainer request");
    if (request.client_id !== req.userId) throw new ForbiddenError();
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already responded to" });
    }

    if (action === "approve") {
      db.transaction(() => {
        db.prepare("UPDATE trainer_requests SET status = 'approved', responded_at = datetime('now') WHERE id = ?")
          .run(requestId);
        db.prepare("UPDATE users SET trainer_id = ? WHERE id = ?")
          .run(request.trainer_id, req.userId);
      })();

      await eventBus.emit("trainer.request.approved", {
        request,
        trainerId: request.trainer_id,
        clientId: req.userId,
      });
    } else {
      db.prepare("UPDATE trainer_requests SET status = 'declined', responded_at = datetime('now') WHERE id = ?")
        .run(requestId);

      await eventBus.emit("trainer.request.declined", {
        request,
        trainerId: request.trainer_id,
        clientId: req.userId,
      });
    }

    const updated = db.prepare("SELECT * FROM trainer_requests WHERE id = ?").get(requestId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ─── Trainer creates template for client ────────────────────

async function createTemplateForClient(req, res, next) {
  try {
    const db = getDb();
    const clientId = parseInt(req.params.clientId, 10);

    // Verify trainer-client relationship
    const client = db.prepare("SELECT trainer_id FROM users WHERE id = ? AND role = 'client'").get(clientId);
    if (!client || client.trainer_id !== req.userId) throw new ForbiddenError("Not your client");

    const { name, description, category, difficulty, estimatedDurationMin, exercises } = req.body;

    const result = db.transaction(() => {
      const templateResult = db
        .prepare(
          `INSERT INTO workout_templates (name, description, category, difficulty, estimated_duration_min, is_public, created_by)
           VALUES (?, ?, ?, ?, ?, 0, ?)`
        )
        .run(name, description || null, category || null, difficulty || "intermediate", estimatedDurationMin || null, req.userId);

      const templateId = templateResult.lastInsertRowid;

      // Add exercises if provided
      if (exercises && exercises.length > 0) {
        const insertEx = db.prepare(
          `INSERT INTO template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_weight_kg, rest_seconds, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );
        exercises.forEach((ex, idx) => {
          insertEx.run(
            templateId,
            ex.exerciseId,
            ex.sortOrder || idx + 1,
            ex.targetSets || 3,
            ex.targetReps || 10,
            ex.targetWeightKg || null,
            ex.restSeconds || 60,
            ex.notes || null
          );
        });
      }

      // Auto-assign to client
      db.prepare(
        `INSERT INTO assigned_workouts (client_id, template_id, assigned_by, notes)
         VALUES (?, ?, ?, ?)`
      ).run(clientId, templateId, req.userId, "Created by trainer");

      return templateId;
    })();

    const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(result);

    await eventBus.emit("workout.assigned", {
      assignment: { template_name: template.name },
      trainerId: req.userId,
      clientId,
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  myClients,
  searchClients,
  sendTrainerRequest,
  listTrainerRequests,
  listClientRequests,
  respondToRequest,
  createTemplateForClient,
};
