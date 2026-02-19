const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");

function list(req, res, next) {
  try {
    const db = getDb();
    const { category, muscleGroup, equipmentId, search, custom } = req.query;

    let sql = "SELECT * FROM exercises";
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (muscleGroup) {
      conditions.push("muscle_group = ?");
      params.push(muscleGroup);
    }
    if (equipmentId) {
      conditions.push("equipment_id = ?");
      params.push(parseInt(equipmentId, 10));
    }
    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (custom === "true") {
      conditions.push("is_custom = 1");
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY name ASC";

    const exercises = db.prepare(sql).all(...params);
    res.json(exercises);
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const db = getDb();
    const exercise = db
      .prepare("SELECT * FROM exercises WHERE id = ?")
      .get(parseInt(req.params.id, 10));
    if (!exercise) {
      throw new NotFoundError("Exercise");
    }
    res.json(exercise);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const db = getDb();
    const {
      name, description, category, muscleGroup, secondaryMuscles,
      equipmentId, equipment, instructions, videoUrl, photoUrl,
    } = req.body;

    const result = db
      .prepare(
        `INSERT INTO exercises (name, description, category, muscle_group, secondary_muscles,
         equipment_id, equipment, instructions, video_url, photo_url, is_custom, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .run(
        name,
        description || null,
        category,
        muscleGroup,
        JSON.stringify(secondaryMuscles || []),
        equipmentId || null,
        equipment || null,
        instructions || null,
        videoUrl || null,
        photoUrl || null,
        req.userId
      );

    const exercise = db.prepare("SELECT * FROM exercises WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const exercise = db.prepare("SELECT * FROM exercises WHERE id = ?").get(id);
    if (!exercise) throw new NotFoundError("Exercise");

    // Only creator or admin can update custom exercises
    if (exercise.is_custom && exercise.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError("Can only update your own custom exercises");
    }

    const fields = [];
    const values = [];
    const allowed = {
      name: "name", description: "description", category: "category",
      muscleGroup: "muscle_group", equipment: "equipment",
      equipmentId: "equipment_id", instructions: "instructions",
      videoUrl: "video_url", photoUrl: "photo_url",
    };

    for (const [bodyKey, dbKey] of Object.entries(allowed)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(req.body[bodyKey]);
      }
    }
    if (req.body.secondaryMuscles !== undefined) {
      fields.push("secondary_muscles = ?");
      values.push(JSON.stringify(req.body.secondaryMuscles));
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE exercises SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare("SELECT * FROM exercises WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const exercise = db.prepare("SELECT * FROM exercises WHERE id = ?").get(id);
    if (!exercise) throw new NotFoundError("Exercise");

    if (exercise.is_custom && exercise.created_by !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError("Can only delete your own custom exercises");
    }

    db.prepare("DELETE FROM exercises WHERE id = ?").run(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
