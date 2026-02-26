const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

function getTemplateWithExercises(db, id) {
  const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(id);
  if (!template) return null;

  const exercises = db
    .prepare(
      `SELECT te.*, e.name as exercise_name, e.category, e.muscle_group, e.equipment, e.video_url, e.instructions
       FROM template_exercises te
       JOIN exercises e ON te.exercise_id = e.id
       WHERE te.template_id = ?
       ORDER BY te.sort_order`
    )
    .all(id);

  template.exercises = exercises.map((e) => ({
    ...e,
    machine_settings: JSON.parse(e.machine_settings || "{}"),
  }));

  return template;
}

function list(req, res, next) {
  try {
    const db = getDb();
    const { category, difficulty, search, ownOnly } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    let sql = "SELECT * FROM workout_templates";
    let countSql = "SELECT COUNT(*) as total FROM workout_templates";
    const conditions = [];
    const params = [];

    // ownOnly=true returns only the user's created templates (no public/shared ones)
    if (ownOnly === "true") {
      conditions.push("created_by = ?");
      params.push(req.userId);
    } else {
      // Show own templates, public ones, and templates assigned to this user
      conditions.push("(created_by = ? OR is_public = 1 OR id IN (SELECT template_id FROM assigned_workouts WHERE client_id = ? AND is_active = 1))");
      params.push(req.userId, req.userId);
    }

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (difficulty) {
      conditions.push("difficulty = ?");
      params.push(difficulty);
    }
    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s);
    }

    const where = " WHERE " + conditions.join(" AND ");
    sql += where;
    countSql += where;

    const { total } = db.prepare(countSql).get(...params);
    sql += " ORDER BY updated_at DESC" + pagSql;
    const data = db.prepare(sql).all(...params);

    res.json(paginatedResponse(data, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const db = getDb();
    const template = getTemplateWithExercises(db, parseInt(req.params.id, 10));
    if (!template) throw new NotFoundError("Workout template");

    // Check access: own template, public, assigned to user, or trainer viewing client's template
    if (template.created_by !== req.userId && !template.is_public && req.userRole !== "admin") {
      // Check if assigned to this user
      const assigned = db.prepare("SELECT id FROM assigned_workouts WHERE template_id = ? AND client_id = ? AND is_active = 1").get(template.id, req.userId);
      if (!assigned) {
        // Check if trainer viewing their client's template
        if (req.userRole === "trainer") {
          const isClient = db.prepare("SELECT id FROM users WHERE id = ? AND trainer_id = ?").get(template.created_by, req.userId);
          if (!isClient) throw new ForbiddenError();
        } else {
          throw new ForbiddenError();
        }
      }
    }

    res.json(template);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const db = getDb();
    const { name, description, category, difficulty, estimatedDurationMin, isPublic } = req.body;

    const result = db
      .prepare(
        `INSERT INTO workout_templates (name, description, category, difficulty, estimated_duration_min, is_public, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        description || null,
        category || null,
        difficulty || "intermediate",
        estimatedDurationMin || null,
        isPublic ? 1 : 0,
        req.userId
      );

    const template = getTemplateWithExercises(db, result.lastInsertRowid);
    await eventBus.emit("template.created", { template, userId: req.userId });
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const existing = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(id);
    if (!existing) throw new NotFoundError("Workout template");
    if (existing.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    const fields = [];
    const values = [];
    const allowed = { name: "name", description: "description", category: "category", difficulty: "difficulty" };

    for (const [bodyKey, dbKey] of Object.entries(allowed)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(req.body[bodyKey]);
      }
    }
    if (req.body.estimatedDurationMin !== undefined) {
      fields.push("estimated_duration_min = ?");
      values.push(req.body.estimatedDurationMin);
    }
    if (req.body.isPublic !== undefined) {
      fields.push("is_public = ?");
      values.push(req.body.isPublic ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE workout_templates SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    const template = getTemplateWithExercises(db, id);
    await eventBus.emit("template.updated", { template, userId: req.userId });
    res.json(template);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const existing = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(id);
    if (!existing) throw new NotFoundError("Workout template");
    if (existing.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    db.prepare("DELETE FROM workout_templates WHERE id = ?").run(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function addExercise(req, res, next) {
  try {
    const db = getDb();
    const templateId = parseInt(req.params.id, 10);

    const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(templateId);
    if (!template) throw new NotFoundError("Workout template");
    if (template.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    const { exerciseId, sortOrder, targetSets, targetReps, targetWeightKg, restSeconds, notes, supersetGroup, machineSettings } = req.body;

    const exercise = db.prepare("SELECT id FROM exercises WHERE id = ?").get(exerciseId);
    if (!exercise) throw new NotFoundError("Exercise");

    const maxOrder = db
      .prepare("SELECT MAX(sort_order) as maxOrder FROM template_exercises WHERE template_id = ?")
      .get(templateId);

    const result = db
      .prepare(
        `INSERT INTO template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_weight_kg, rest_seconds, notes, superset_group, machine_settings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        templateId,
        exerciseId,
        sortOrder ?? (maxOrder.maxOrder || 0) + 1,
        targetSets || 3,
        targetReps || 10,
        targetWeightKg || null,
        restSeconds || 60,
        notes || null,
        supersetGroup || null,
        JSON.stringify(machineSettings || {})
      );

    const added = db.prepare("SELECT * FROM template_exercises WHERE id = ?").get(result.lastInsertRowid);
    added.machine_settings = JSON.parse(added.machine_settings || "{}");
    res.status(201).json(added);
  } catch (err) {
    next(err);
  }
}

function updateExercise(req, res, next) {
  try {
    const db = getDb();
    const templateId = parseInt(req.params.id, 10);
    const teId = parseInt(req.params.teId, 10);

    const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(templateId);
    if (!template) throw new NotFoundError("Workout template");
    if (template.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    const te = db.prepare("SELECT * FROM template_exercises WHERE id = ? AND template_id = ?").get(teId, templateId);
    if (!te) throw new NotFoundError("Template exercise");

    const fields = [];
    const values = [];
    const allowed = {
      sortOrder: "sort_order", targetSets: "target_sets", targetReps: "target_reps",
      targetWeightKg: "target_weight_kg", restSeconds: "rest_seconds",
      notes: "notes", supersetGroup: "superset_group",
    };

    for (const [bodyKey, dbKey] of Object.entries(allowed)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(req.body[bodyKey]);
      }
    }
    if (req.body.machineSettings !== undefined) {
      fields.push("machine_settings = ?");
      values.push(JSON.stringify(req.body.machineSettings));
    }

    if (fields.length > 0) {
      values.push(teId);
      db.prepare(`UPDATE template_exercises SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare("SELECT * FROM template_exercises WHERE id = ?").get(teId);
    updated.machine_settings = JSON.parse(updated.machine_settings || "{}");
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function removeExercise(req, res, next) {
  try {
    const db = getDb();
    const templateId = parseInt(req.params.id, 10);
    const teId = parseInt(req.params.teId, 10);

    const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(templateId);
    if (!template) throw new NotFoundError("Workout template");
    if (template.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    const te = db.prepare("SELECT * FROM template_exercises WHERE id = ? AND template_id = ?").get(teId, templateId);
    if (!te) throw new NotFoundError("Template exercise");

    db.prepare("DELETE FROM template_exercises WHERE id = ?").run(teId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function duplicate(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const original = getTemplateWithExercises(db, id);
    if (!original) throw new NotFoundError("Workout template");
    if (original.created_by !== req.userId && !original.is_public && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    const result = db
      .prepare(
        `INSERT INTO workout_templates (name, description, category, difficulty, estimated_duration_min, is_public, created_by)
         VALUES (?, ?, ?, ?, ?, 0, ?)`
      )
      .run(
        `${original.name} (Copy)`,
        original.description,
        original.category,
        original.difficulty,
        original.estimated_duration_min,
        req.userId
      );

    const newId = result.lastInsertRowid;

    for (const ex of original.exercises) {
      db.prepare(
        `INSERT INTO template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_weight_kg, rest_seconds, notes, superset_group, machine_settings)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId, ex.exercise_id, ex.sort_order, ex.target_sets, ex.target_reps,
        ex.target_weight_kg, ex.rest_seconds, ex.notes, ex.superset_group,
        JSON.stringify(ex.machine_settings)
      );
    }

    const template = getTemplateWithExercises(db, newId);
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
}

function listClientTemplates(req, res, next) {
  try {
    const db = getDb();
    const clientId = parseInt(req.params.clientId, 10);

    // Verify trainer-client relationship
    if (req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(clientId);
      if (!client || client.trainer_id !== req.userId) {
        throw new ForbiddenError();
      }
    }

    // Get templates created by client + templates assigned to client by this trainer
    const templates = db
      .prepare(
        `SELECT DISTINCT wt.* FROM workout_templates wt
         WHERE wt.created_by = ?
         UNION
         SELECT DISTINCT wt.* FROM workout_templates wt
         JOIN assigned_workouts aw ON aw.template_id = wt.id
         WHERE aw.client_id = ? AND aw.is_active = 1
         ORDER BY name`
      )
      .all(clientId, clientId);

    res.json(templates);
  } catch (err) {
    next(err);
  }
}

function replaceExercise(req, res, next) {
  try {
    const db = getDb();
    const templateId = parseInt(req.params.id, 10);
    const teId = parseInt(req.params.teId, 10);
    const { newExerciseId } = req.body;

    const template = db.prepare("SELECT * FROM workout_templates WHERE id = ?").get(templateId);
    if (!template) throw new NotFoundError("Workout template");
    if (template.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    const te = db.prepare("SELECT * FROM template_exercises WHERE id = ? AND template_id = ?").get(teId, templateId);
    if (!te) throw new NotFoundError("Template exercise");

    const newExercise = db.prepare("SELECT id FROM exercises WHERE id = ?").get(newExerciseId);
    if (!newExercise) throw new NotFoundError("Exercise");

    db.prepare("UPDATE template_exercises SET exercise_id = ? WHERE id = ?").run(newExerciseId, teId);

    const updated = getTemplateWithExercises(db, templateId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, addExercise, updateExercise, removeExercise, replaceExercise, duplicate, listClientTemplates };
