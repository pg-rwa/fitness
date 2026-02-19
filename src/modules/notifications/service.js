const { getDb } = require("../../config/database");

function createNotification({ userId, type, title, body, data }) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(userId, type, title, body || null, JSON.stringify(data || {}));

  return db.prepare("SELECT * FROM notifications WHERE id = ?").get(result.lastInsertRowid);
}

function getUnreadCount(userId) {
  const db = getDb();
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0")
    .get(userId);
  return count;
}

module.exports = { createNotification, getUnreadCount };
