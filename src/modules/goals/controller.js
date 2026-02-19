const { getDb } = require("../../config/database");

function list(req, res, next) {
  try {
    const db = getDb();
    const goals = db
      .prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC")
      .all(req.userId);
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const db = getDb();
    const result = db
      .prepare(
        "INSERT INTO goals (user_id, title, description, target_date) VALUES (?, ?, ?, ?)"
      )
      .run(
        req.userId,
        req.body.title,
        req.body.description || null,
        req.body.targetDate || null
      );

    const goal = db
      .prepare("SELECT * FROM goals WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const db = getDb();
    const goalId = parseInt(req.params.id, 10);

    const goal = db
      .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
      .get(goalId, req.userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const fields = [];
    const values = [];
    if (req.body.title !== undefined) {
      fields.push("title = ?");
      values.push(req.body.title);
    }
    if (req.body.description !== undefined) {
      fields.push("description = ?");
      values.push(req.body.description);
    }
    if (req.body.targetDate !== undefined) {
      fields.push("target_date = ?");
      values.push(req.body.targetDate);
    }
    if (req.body.status !== undefined) {
      fields.push("status = ?");
      values.push(req.body.status);
    }
    fields.push("updated_at = datetime('now')");
    values.push(goalId);

    db.prepare(`UPDATE goals SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    const updated = db.prepare("SELECT * FROM goals WHERE id = ?").get(goalId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const db = getDb();
    const goalId = parseInt(req.params.id, 10);

    const goal = db
      .prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?")
      .get(goalId, req.userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    db.prepare("DELETE FROM goals WHERE id = ?").run(goalId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
