const { getDb } = require("../../config/database");

function registerDevice(req, res, next) {
  try {
    const db = getDb();
    const { token, platform } = req.body;

    // Upsert: update user_id if token exists, otherwise insert
    const existing = db.prepare("SELECT * FROM device_tokens WHERE token = ?").get(token);
    if (existing) {
      db.prepare(
        "UPDATE device_tokens SET user_id = ?, platform = ?, is_active = 1, updated_at = datetime('now') WHERE token = ?"
      ).run(req.userId, platform || "expo", token);
    } else {
      db.prepare(
        "INSERT INTO device_tokens (user_id, token, platform) VALUES (?, ?, ?)"
      ).run(req.userId, token, platform || "expo");
    }

    res.status(201).json({ message: "Device registered" });
  } catch (err) {
    next(err);
  }
}

function unregisterDevice(req, res, next) {
  try {
    const db = getDb();
    const { token } = req.body;

    db.prepare("UPDATE device_tokens SET is_active = 0, updated_at = datetime('now') WHERE token = ? AND user_id = ?")
      .run(token, req.userId);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function listDevices(req, res, next) {
  try {
    const db = getDb();
    const devices = db
      .prepare("SELECT id, platform, is_active, created_at FROM device_tokens WHERE user_id = ?")
      .all(req.userId);
    res.json(devices);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerDevice, unregisterDevice, listDevices };
