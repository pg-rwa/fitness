const { getDb } = require("../../config/database");
const { NotFoundError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");

const CATEGORIES = ["machine", "free_weight", "cable", "bodyweight", "cardio", "other"];

function list(req, res, next) {
  try {
    const db = getDb();
    const { category, search } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    let sql = "SELECT * FROM equipment";
    let countSql = "SELECT COUNT(*) as total FROM equipment";
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (search) {
      conditions.push("(name LIKE ? OR brand LIKE ? OR model LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (conditions.length > 0) {
      const where = " WHERE " + conditions.join(" AND ");
      sql += where;
      countSql += where;
    }

    const { total } = db.prepare(countSql).get(...params);
    sql += " ORDER BY name ASC" + pagSql;
    const data = db.prepare(sql).all(...params);

    res.json(paginatedResponse(data, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const db = getDb();
    const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(parseInt(req.params.id, 10));
    if (!item) throw new NotFoundError("Equipment");
    res.json(item);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const db = getDb();
    const { name, brand, model, category, photoUrl, defaultSettings, gymLocation, notes } = req.body;

    const result = db
      .prepare(
        `INSERT INTO equipment (name, brand, model, category, photo_url, default_settings, gym_location, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        brand || null,
        model || null,
        category || "other",
        photoUrl || null,
        JSON.stringify(defaultSettings || {}),
        gymLocation || null,
        notes || null,
        req.userId
      );

    const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const existing = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
    if (!existing) throw new NotFoundError("Equipment");

    const fields = [];
    const values = [];
    const allowed = { name: "name", brand: "brand", model: "model", category: "category", photoUrl: "photo_url", gymLocation: "gym_location", notes: "notes" };

    for (const [bodyKey, dbKey] of Object.entries(allowed)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(req.body[bodyKey]);
      }
    }
    if (req.body.defaultSettings !== undefined) {
      fields.push("default_settings = ?");
      values.push(JSON.stringify(req.body.defaultSettings));
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE equipment SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    const item = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
    res.json(item);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const existing = db.prepare("SELECT * FROM equipment WHERE id = ?").get(id);
    if (!existing) throw new NotFoundError("Equipment");

    db.prepare("DELETE FROM equipment WHERE id = ?").run(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, CATEGORIES };
