const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

function getSessionFull(db, id) {
  const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ?").get(id);
  if (!session) return null;

  const exercises = db
    .prepare(
      `SELECT se.*, e.name as exercise_name, e.category, e.muscle_group, e.equipment, e.video_url, e.instructions, e.thumbnail_url
       FROM session_exercises se
       JOIN exercises e ON se.exercise_id = e.id
       WHERE se.session_id = ?
       ORDER BY se.sort_order`
    )
    .all(id);

  for (const ex of exercises) {
    ex.machine_settings = JSON.parse(ex.machine_settings || "{}");
    ex.sets = db
      .prepare("SELECT * FROM exercise_sets WHERE session_exercise_id = ? ORDER BY set_number")
      .all(ex.id);
  }

  session.exercises = exercises;
  return session;
}

function list(req, res, next) {
  try {
    const db = getDb();
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;

    // If viewing another user's sessions, must be their trainer or admin
    if (targetUserId !== req.userId) {
      if (req.userRole !== "admin") {
        const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(targetUserId);
        if (!client || client.trainer_id !== req.userId) {
          throw new ForbiddenError();
        }
      }
    }

    const countSql = "SELECT COUNT(*) as total FROM workout_sessions WHERE user_id = ?";
    const { total } = db.prepare(countSql).get(targetUserId);

    const sessions = db
      .prepare(`SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC${pagSql}`)
      .all(targetUserId);

    res.json(paginatedResponse(sessions, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const db = getDb();
    const session = getSessionFull(db, parseInt(req.params.id, 10));
    if (!session) throw new NotFoundError("Workout session");

    // Check access
    if (session.user_id !== req.userId && req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(session.user_id);
      if (!client || client.trainer_id !== req.userId) {
        throw new ForbiddenError();
      }
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const db = getDb();
    const { templateId, name, notes, moodBefore, scheduledAt } = req.body;

    let sessionName = name;
    let exercises = [];

    // If creating from template, copy exercises over
    if (templateId) {
      const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(templateId);
      if (!template) throw new NotFoundError("Workout template");
      if (!sessionName) sessionName = template.name;

      exercises = db
        .prepare("SELECT * FROM template_exercises WHERE template_id = ? ORDER BY sort_order")
        .all(templateId);
    }

    const result = db
      .prepare(
        `INSERT INTO workout_sessions (user_id, template_id, name, notes, mood_before, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(req.userId, templateId || null, sessionName || "Workout", notes || null, moodBefore || null, scheduledAt || null);

    const sessionId = result.lastInsertRowid;

    // Copy template exercises into session (no pre-populated sets — user logs actual sets)
    for (const ex of exercises) {
      db.prepare(
        `INSERT INTO session_exercises (session_id, exercise_id, sort_order, machine_settings)
         VALUES (?, ?, ?, ?)`
      ).run(sessionId, ex.exercise_id, ex.sort_order, ex.machine_settings);
    }

    const session = getSessionFull(db, sessionId);
    await eventBus.emit("workout.started", { session, userId: req.userId });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

function addExercise(req, res, next) {
  try {
    const db = getDb();
    const sessionId = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?").get(sessionId, req.userId);
    if (!session) throw new NotFoundError("Workout session");
    if (session.ended_at) throw new ForbiddenError("Session already completed");

    const { exerciseId, sortOrder, machineSettings } = req.body;

    const exercise = db.prepare("SELECT id FROM exercises WHERE id = ?").get(exerciseId);
    if (!exercise) throw new NotFoundError("Exercise");

    const maxOrder = db
      .prepare("SELECT MAX(sort_order) as maxOrder FROM session_exercises WHERE session_id = ?")
      .get(sessionId);

    const result = db
      .prepare(
        `INSERT INTO session_exercises (session_id, exercise_id, sort_order, machine_settings)
         VALUES (?, ?, ?, ?)`
      )
      .run(sessionId, exerciseId, sortOrder ?? (maxOrder.maxOrder || 0) + 1, JSON.stringify(machineSettings || {}));

    const se = db.prepare("SELECT * FROM session_exercises WHERE id = ?").get(result.lastInsertRowid);
    se.machine_settings = JSON.parse(se.machine_settings || "{}");
    se.sets = [];
    res.status(201).json(se);
  } catch (err) {
    next(err);
  }
}

function logSet(req, res, next) {
  try {
    const db = getDb();
    const sessionId = parseInt(req.params.id, 10);
    const seId = parseInt(req.params.seId, 10);

    const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?").get(sessionId, req.userId);
    if (!session) throw new NotFoundError("Workout session");
    if (session.ended_at) throw new ForbiddenError("Session already completed");

    const se = db.prepare("SELECT * FROM session_exercises WHERE id = ? AND session_id = ?").get(seId, sessionId);
    if (!se) throw new NotFoundError("Session exercise");

    const { setNumber, setType, reps, weightKg, durationSec, distanceM, rpe, completed, notes } = req.body;

    const maxSet = db
      .prepare("SELECT MAX(set_number) as maxSet FROM exercise_sets WHERE session_exercise_id = ?")
      .get(seId);

    const result = db
      .prepare(
        `INSERT INTO exercise_sets (session_exercise_id, set_number, set_type, reps, weight_kg, duration_sec, distance_m, rpe, completed, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        seId,
        setNumber ?? (maxSet.maxSet || 0) + 1,
        setType || "working",
        reps || null,
        weightKg || null,
        durationSec || null,
        distanceM || null,
        rpe || null,
        completed ? 1 : 0,
        notes || null
      );

    const set = db.prepare("SELECT * FROM exercise_sets WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(set);
  } catch (err) {
    next(err);
  }
}

function updateSet(req, res, next) {
  try {
    const db = getDb();
    const sessionId = parseInt(req.params.id, 10);
    const seId = parseInt(req.params.seId, 10);
    const setId = parseInt(req.params.setId, 10);

    const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?").get(sessionId, req.userId);
    if (!session) throw new NotFoundError("Workout session");

    const se = db.prepare("SELECT * FROM session_exercises WHERE id = ? AND session_id = ?").get(seId, sessionId);
    if (!se) throw new NotFoundError("Session exercise");

    const existing = db.prepare("SELECT * FROM exercise_sets WHERE id = ? AND session_exercise_id = ?").get(setId, seId);
    if (!existing) throw new NotFoundError("Exercise set");

    const fields = [];
    const values = [];
    const allowed = {
      setType: "set_type", reps: "reps", weightKg: "weight_kg",
      durationSec: "duration_sec", distanceM: "distance_m",
      rpe: "rpe", completed: "completed", notes: "notes",
    };

    for (const [bodyKey, dbKey] of Object.entries(allowed)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(bodyKey === "completed" ? (req.body[bodyKey] ? 1 : 0) : req.body[bodyKey]);
      }
    }

    if (fields.length > 0) {
      values.push(setId);
      db.prepare(`UPDATE exercise_sets SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    const set = db.prepare("SELECT * FROM exercise_sets WHERE id = ?").get(setId);
    res.json(set);
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const db = getDb();
    const sessionId = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?").get(sessionId, req.userId);
    if (!session) throw new NotFoundError("Workout session");
    if (session.ended_at) throw new ForbiddenError("Session already completed");

    const { moodAfter, notes } = req.body || {};

    // Calculate total volume (all sets with weight and reps)
    const volumeResult = db
      .prepare(
        `SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) as total_volume
         FROM exercise_sets es
         JOIN session_exercises se ON es.session_exercise_id = se.id
         WHERE se.session_id = ? AND es.weight_kg > 0 AND es.reps > 0`
      )
      .get(sessionId);

    const updateFields = ["ended_at = datetime('now')", "total_volume = ?"];
    const updateValues = [volumeResult.total_volume];

    if (moodAfter !== undefined) {
      updateFields.push("mood_after = ?");
      updateValues.push(moodAfter);
    }
    if (notes !== undefined) {
      updateFields.push("notes = ?");
      updateValues.push(notes);
    }

    updateValues.push(sessionId);
    db.prepare(`UPDATE workout_sessions SET ${updateFields.join(", ")} WHERE id = ?`).run(...updateValues);

    // Check for personal records
    const prs = checkPersonalRecords(db, sessionId, req.userId);

    const completed = getSessionFull(db, sessionId);
    completed.personal_records = prs;

    await eventBus.emit("workout.completed", { session: completed, userId: req.userId, personalRecords: prs });

    res.json(completed);
  } catch (err) {
    next(err);
  }
}

function checkPersonalRecords(db, sessionId, userId) {
  const prs = [];

  // Get all exercises in this session with their best set
  const sessionExercises = db
    .prepare(
      `SELECT se.exercise_id, MAX(es.weight_kg) as max_weight, MAX(es.reps) as max_reps,
              MAX(es.weight_kg * es.reps) as max_volume_set
       FROM session_exercises se
       JOIN exercise_sets es ON es.session_exercise_id = se.id
       WHERE se.session_id = ? AND es.weight_kg > 0 AND es.reps > 0
       GROUP BY se.exercise_id`
    )
    .all(sessionId);

  for (const ex of sessionExercises) {
    // Check max weight PR
    const prevMaxWeight = db
      .prepare(
        `SELECT MAX(value) as prev FROM personal_records
         WHERE user_id = ? AND exercise_id = ? AND record_type = 'max_weight'`
      )
      .get(userId, ex.exercise_id);

    if (!prevMaxWeight.prev || ex.max_weight > prevMaxWeight.prev) {
      const result = db
        .prepare(
          `INSERT INTO personal_records (user_id, exercise_id, record_type, value, previous_value, session_id)
           VALUES (?, ?, 'max_weight', ?, ?, ?)`
        )
        .run(userId, ex.exercise_id, ex.max_weight, prevMaxWeight.prev || 0, sessionId);

      prs.push({
        id: result.lastInsertRowid,
        exercise_id: ex.exercise_id,
        record_type: "max_weight",
        value: ex.max_weight,
        previous_value: prevMaxWeight.prev || 0,
      });
    }

    // Check max volume (weight * reps) PR
    const prevMaxVolume = db
      .prepare(
        `SELECT MAX(value) as prev FROM personal_records
         WHERE user_id = ? AND exercise_id = ? AND record_type = 'max_volume_set'`
      )
      .get(userId, ex.exercise_id);

    if (ex.max_volume_set && (!prevMaxVolume.prev || ex.max_volume_set > prevMaxVolume.prev)) {
      const result = db
        .prepare(
          `INSERT INTO personal_records (user_id, exercise_id, record_type, value, previous_value, session_id)
           VALUES (?, ?, 'max_volume_set', ?, ?, ?)`
        )
        .run(userId, ex.exercise_id, ex.max_volume_set, prevMaxVolume.prev || 0, sessionId);

      prs.push({
        id: result.lastInsertRowid,
        exercise_id: ex.exercise_id,
        record_type: "max_volume_set",
        value: ex.max_volume_set,
        previous_value: prevMaxVolume.prev || 0,
      });
    }
  }

  return prs;
}

function exerciseHistory(req, res, next) {
  try {
    const db = getDb();
    const exerciseId = parseInt(req.params.exerciseId, 10);

    // Get last 10 sessions where this exercise was performed by the user
    const rows = db
      .prepare(
        `SELECT ws.id as session_id, ws.name as session_name, ws.started_at,
                se.id as session_exercise_id
         FROM workout_sessions ws
         JOIN session_exercises se ON se.session_id = ws.id
         WHERE ws.user_id = ? AND se.exercise_id = ? AND ws.ended_at IS NOT NULL
         ORDER BY ws.started_at DESC
         LIMIT 10`
      )
      .all(req.userId, exerciseId);

    const history = rows.map((row) => {
      const sets = db
        .prepare("SELECT * FROM exercise_sets WHERE session_exercise_id = ? ORDER BY set_number")
        .all(row.session_exercise_id);
      return {
        session_id: row.session_id,
        session_name: row.session_name,
        date: row.started_at,
        sets,
      };
    });

    res.json(history);
  } catch (err) {
    next(err);
  }
}

function replaceExercise(req, res, next) {
  try {
    const db = getDb();
    const sessionId = parseInt(req.params.id, 10);
    const seId = parseInt(req.params.seId, 10);
    const { newExerciseId, updateTemplate } = req.body;

    const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?").get(sessionId, req.userId);
    if (!session) throw new NotFoundError("Workout session");
    if (session.ended_at) throw new ForbiddenError("Session already completed");

    const se = db.prepare("SELECT * FROM session_exercises WHERE id = ? AND session_id = ?").get(seId, sessionId);
    if (!se) throw new NotFoundError("Session exercise");

    const newExercise = db.prepare("SELECT id FROM exercises WHERE id = ?").get(newExerciseId);
    if (!newExercise) throw new NotFoundError("Exercise");

    const oldExerciseId = se.exercise_id;

    // Replace exercise in session
    db.prepare("UPDATE session_exercises SET exercise_id = ? WHERE id = ?").run(newExerciseId, seId);

    // Delete any pre-populated sets for this exercise (user will log fresh)
    db.prepare("DELETE FROM exercise_sets WHERE session_exercise_id = ?").run(seId);

    // Also update the template if requested and session was started from a template
    if (updateTemplate && session.template_id) {
      const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(session.template_id);
      if (template && template.created_by === req.userId) {
        db.prepare(
          "UPDATE template_exercises SET exercise_id = ? WHERE template_id = ? AND exercise_id = ?"
        ).run(newExerciseId, session.template_id, oldExerciseId);
      }
    }

    const updated = getSessionFull(db, sessionId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM workout_sessions WHERE id = ?").get(id);
    if (!session) throw new NotFoundError("Workout session");

    // Owner, their trainer, or admin can delete
    if (session.user_id !== req.userId && req.userRole !== "admin") {
      if (req.userRole === "trainer") {
        const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(session.user_id);
        if (!client || client.trainer_id !== req.userId) throw new ForbiddenError();
      } else {
        throw new ForbiddenError();
      }
    }

    db.transaction(() => {
      // Delete sets -> session_exercises -> session
      const seIds = db.prepare("SELECT id FROM session_exercises WHERE session_id = ?").all(id).map(r => r.id);
      if (seIds.length > 0) {
        db.prepare(`DELETE FROM exercise_sets WHERE session_exercise_id IN (${seIds.map(() => '?').join(',')})`).run(...seIds);
      }
      db.prepare("DELETE FROM session_exercises WHERE session_id = ?").run(id);
      db.prepare("DELETE FROM workout_sessions WHERE id = ?").run(id);
    })();

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, addExercise, logSet, updateSet, complete, exerciseHistory, replaceExercise, remove };
