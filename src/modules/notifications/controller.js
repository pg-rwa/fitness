const { getDb } = require("../../config/database");
const { NotFoundError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { getUnreadCount } = require("./service");

function list(req, res, next) {
  try {
    const db = getDb();
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    const countSql = "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?";
    const { total } = db.prepare(countSql).get(req.userId);

    const data = db
      .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC${pagSql}`)
      .all(req.userId);

    const parsed = data.map((n) => ({
      ...n,
      data: JSON.parse(n.data || "{}"),
    }));

    res.json({
      ...paginatedResponse(parsed, { page, limit, total }),
      unreadCount: getUnreadCount(req.userId),
    });
  } catch (err) {
    next(err);
  }
}

function markRead(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const notification = db.prepare("SELECT * FROM notifications WHERE id = ? AND user_id = ?").get(id, req.userId);
    if (!notification) throw new NotFoundError("Notification");

    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ ...notification, is_read: 1 });
  } catch (err) {
    next(err);
  }
}

function markAllRead(req, res, next) {
  try {
    const db = getDb();
    const result = db
      .prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0")
      .run(req.userId);
    res.json({ updated: result.changes });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
