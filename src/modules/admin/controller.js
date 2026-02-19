const { getDb } = require("../../config/database");
const { NotFoundError } = require("../../shared/utils/errors");

let featuresRef = null;

function setFeaturesRef(features) {
  featuresRef = features;
}

function listFeatures(req, res, next) {
  try {
    if (!featuresRef) return res.json({});
    res.json(featuresRef.getAll());
  } catch (err) {
    next(err);
  }
}

function toggleFeature(req, res, next) {
  try {
    if (!featuresRef) return res.status(503).json({ error: "Feature flags not available" });
    const { name } = req.params;
    const { enabled } = req.body;

    if (enabled) {
      featuresRef.enable(name);
    } else {
      featuresRef.disable(name);
    }

    res.json({ name, enabled: featuresRef.isEnabled(name) });
  } catch (err) {
    next(err);
  }
}

function listUsers(req, res, next) {
  try {
    const db = getDb();
    const { role, status, page = 1, limit = 50 } = req.query;

    let sql = "SELECT id, email, first_name, last_name, role, status, trainer_id, created_at FROM users";
    const conditions = [];
    const params = [];

    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

    const users = db.prepare(sql).all(...params);

    let countSql = "SELECT COUNT(*) as total FROM users";
    if (conditions.length > 0) {
      countSql += " WHERE " + conditions.join(" AND ");
    }
    const { total } = db.prepare(countSql).get(...params);

    res.json({
      data: users,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
}

function updateUserRole(req, res, next) {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id, 10);

    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!user) throw new NotFoundError("User");

    db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(req.body.role, userId);
    const updated = db
      .prepare("SELECT id, email, first_name, last_name, role, status, created_at FROM users WHERE id = ?")
      .get(userId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function updateUserStatus(req, res, next) {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id, 10);

    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!user) throw new NotFoundError("User");

    db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(req.body.status, userId);
    const updated = db
      .prepare("SELECT id, email, first_name, last_name, role, status, created_at FROM users WHERE id = ?")
      .get(userId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { setFeaturesRef, listFeatures, toggleFeature, listUsers, updateUserRole, updateUserStatus };
