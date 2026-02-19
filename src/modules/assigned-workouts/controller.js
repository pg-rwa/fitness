const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { eventBus } = require("../../shared/services/event-bus");

function listForClient(req, res, next) {
  try {
    const db = getDb();
    const clientId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;

    // If viewing another user's assignments, must be their trainer or admin
    if (clientId !== req.userId) {
      if (req.userRole !== "admin") {
        const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(clientId);
        if (!client || client.trainer_id !== req.userId) {
          throw new ForbiddenError();
        }
      }
    }

    const assignments = db
      .prepare(
        `SELECT aw.*, wt.name as template_name, wt.category, wt.difficulty,
                u.first_name || ' ' || u.last_name as assigned_by_name
         FROM assigned_workouts aw
         JOIN workout_templates wt ON aw.template_id = wt.id
         JOIN users u ON aw.assigned_by = u.id
         WHERE aw.client_id = ? AND aw.is_active = 1
         ORDER BY aw.day_of_week, aw.created_at DESC`
      )
      .all(clientId);

    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    const db = getDb();
    const clientId = parseInt(req.params.clientId, 10);

    // Verify client exists and is linked to this trainer (or user is admin)
    if (req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(clientId);
      if (!client || client.trainer_id !== req.userId) {
        throw new ForbiddenError("Not your client");
      }
    }

    const { templateId, dayOfWeek, notes } = req.body;

    const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(templateId);
    if (!template) throw new NotFoundError("Workout template");

    const result = db
      .prepare(
        `INSERT INTO assigned_workouts (client_id, template_id, assigned_by, day_of_week, notes)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(clientId, templateId, req.userId, dayOfWeek ?? null, notes || null);

    const assignment = db
      .prepare(
        `SELECT aw.*, wt.name as template_name
         FROM assigned_workouts aw
         JOIN workout_templates wt ON aw.template_id = wt.id
         WHERE aw.id = ?`
      )
      .get(result.lastInsertRowid);

    await eventBus.emit("workout.assigned", { assignment, trainerId: req.userId, clientId });
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

function unassign(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const assignment = db.prepare("SELECT * FROM assigned_workouts WHERE id = ?").get(id);
    if (!assignment) throw new NotFoundError("Assignment");

    if (assignment.assigned_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    db.prepare("UPDATE assigned_workouts SET is_active = 0 WHERE id = ?").run(id);
    res.json({ ...assignment, is_active: 0 });
  } catch (err) {
    next(err);
  }
}

module.exports = { listForClient, assign, unassign };
