const { getDb } = require("../../config/database");

function list(req, res, next) {
  try {
    const db = getDb();
    const { category, muscleGroup } = req.query;

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
      return res.status(404).json({ error: "Exercise not found" });
    }
    res.json(exercise);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById };
