const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

// ─── Measurements ────────────────────────────────────────────

function checkClientAccess(db, targetUserId, req) {
  if (targetUserId !== req.userId && req.userRole !== "admin") {
    const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(targetUserId);
    if (!client || client.trainer_id !== req.userId) {
      throw new ForbiddenError();
    }
  }
}

async function recordMeasurement(req, res, next) {
  try {
    const db = getDb();
    const {
      weightKg, bodyFatPct, chestCm, waistCm, hipsCm,
      bicepLeftCm, bicepRightCm, thighLeftCm, thighRightCm,
      neckCm, notes, recordedAt,
    } = req.body;

    const result = db
      .prepare(
        `INSERT INTO body_measurements (user_id, recorded_at, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm,
         bicep_left_cm, bicep_right_cm, thigh_left_cm, thigh_right_cm, neck_cm, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.userId,
        recordedAt || new Date().toISOString(),
        weightKg || null, bodyFatPct || null, chestCm || null, waistCm || null, hipsCm || null,
        bicepLeftCm || null, bicepRightCm || null, thighLeftCm || null, thighRightCm || null,
        neckCm || null, notes || null
      );

    const measurement = db.prepare("SELECT * FROM body_measurements WHERE id = ?").get(result.lastInsertRowid);
    await eventBus.emit("measurement.recorded", { measurement, userId: req.userId });
    res.status(201).json(measurement);
  } catch (err) {
    next(err);
  }
}

function listMeasurements(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    checkClientAccess(db, targetUserId, req);

    const { start, end } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    let sql = "SELECT * FROM body_measurements WHERE user_id = ?";
    let countSql = "SELECT COUNT(*) as total FROM body_measurements WHERE user_id = ?";
    const params = [targetUserId];

    if (start) {
      sql += " AND recorded_at >= ?";
      countSql += " AND recorded_at >= ?";
      params.push(start);
    }
    if (end) {
      sql += " AND recorded_at <= ?";
      countSql += " AND recorded_at <= ?";
      params.push(end);
    }

    const { total } = db.prepare(countSql).get(...params);
    sql += " ORDER BY recorded_at DESC" + pagSql;
    const data = db.prepare(sql).all(...params);

    res.json(paginatedResponse(data, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function latestMeasurement(req, res, next) {
  try {
    const db = getDb();
    const measurement = db
      .prepare("SELECT * FROM body_measurements WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1")
      .get(req.userId);
    res.json(measurement || null);
  } catch (err) {
    next(err);
  }
}

function measurementTrends(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    checkClientAccess(db, targetUserId, req);

    const { metric, start, end } = req.query;
    const validMetrics = ["weight_kg", "body_fat_pct", "chest_cm", "waist_cm", "hips_cm", "bicep_left_cm", "bicep_right_cm", "thigh_left_cm", "thigh_right_cm", "neck_cm"];
    const field = validMetrics.includes(metric) ? metric : "weight_kg";

    let sql = `SELECT recorded_at, ${field} as value FROM body_measurements WHERE user_id = ? AND ${field} IS NOT NULL`;
    const params = [targetUserId];

    if (start) {
      sql += " AND recorded_at >= ?";
      params.push(start);
    }
    if (end) {
      sql += " AND recorded_at <= ?";
      params.push(end);
    }

    sql += " ORDER BY recorded_at ASC";
    const data = db.prepare(sql).all(...params);
    res.json({ metric: field, data });
  } catch (err) {
    next(err);
  }
}

// ─── Progress Photos ─────────────────────────────────────────

async function uploadPhoto(req, res, next) {
  try {
    const db = getDb();
    const { photoUrl, thumbnailUrl, category, notes, takenAt } = req.body;

    const result = db
      .prepare(
        `INSERT INTO progress_photos (user_id, photo_url, thumbnail_url, category, notes, taken_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.userId,
        photoUrl,
        thumbnailUrl || null,
        category || "front",
        notes || null,
        takenAt || new Date().toISOString()
      );

    const photo = db.prepare("SELECT * FROM progress_photos WHERE id = ?").get(result.lastInsertRowid);
    await eventBus.emit("photo.uploaded", { photo, userId: req.userId });
    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
}

function listPhotos(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    checkClientAccess(db, targetUserId, req);

    const { category, start, end } = req.query;

    let sql = "SELECT * FROM progress_photos WHERE user_id = ?";
    const params = [targetUserId];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    if (start) {
      sql += " AND taken_at >= ?";
      params.push(start);
    }
    if (end) {
      sql += " AND taken_at <= ?";
      params.push(end);
    }

    sql += " ORDER BY taken_at DESC";
    const data = db.prepare(sql).all(...params);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

function comparePhotos(req, res, next) {
  try {
    const db = getDb();
    const { date1, date2, category } = req.query;

    const cat = category || "front";

    const photo1 = db
      .prepare(
        `SELECT * FROM progress_photos WHERE user_id = ? AND category = ? AND taken_at <= ?
         ORDER BY taken_at DESC LIMIT 1`
      )
      .get(req.userId, cat, date1);

    const photo2 = db
      .prepare(
        `SELECT * FROM progress_photos WHERE user_id = ? AND category = ? AND taken_at <= ?
         ORDER BY taken_at DESC LIMIT 1`
      )
      .get(req.userId, cat, date2);

    res.json({ before: photo1 || null, after: photo2 || null });
  } catch (err) {
    next(err);
  }
}

function deletePhoto(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const photo = db.prepare("SELECT * FROM progress_photos WHERE id = ? AND user_id = ?").get(id, req.userId);
    if (!photo) throw new NotFoundError("Photo");

    db.prepare("DELETE FROM progress_photos WHERE id = ?").run(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function uploadPhotoFile(req, res, next) {
  try {
    const { ValidationError } = require("../../shared/utils/errors");
    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }

    const { createFileUploadService } = require("../../shared/services/file-upload");
    const uploadService = createFileUploadService();

    const fileRecord = await uploadService.upload({
      userId: req.userId,
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      entityType: "progress_photo",
    });

    const db = getDb();
    const category = req.body.category || "front";
    const notes = req.body.notes || null;
    const takenAt = req.body.takenAt || new Date().toISOString();

    const result = db
      .prepare(
        `INSERT INTO progress_photos (user_id, photo_url, category, notes, taken_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(req.userId, fileRecord.url, category, notes, takenAt);

    const photo = db.prepare("SELECT * FROM progress_photos WHERE id = ?").get(result.lastInsertRowid);
    await eventBus.emit("photo.uploaded", { photo, userId: req.userId });
    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
}

// ─── Personal Records ────────────────────────────────────────

function listPersonalRecords(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    checkClientAccess(db, targetUserId, req);

    const records = db
      .prepare(
        `SELECT pr.*, e.name as exercise_name, e.muscle_group, e.category as exercise_category
         FROM personal_records pr
         JOIN exercises e ON e.id = pr.exercise_id
         WHERE pr.user_id = ?
         ORDER BY pr.created_at DESC
         LIMIT 50`
      )
      .all(targetUserId);
    res.json(records);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recordMeasurement, listMeasurements, latestMeasurement, measurementTrends,
  uploadPhoto, listPhotos, comparePhotos, deletePhoto, uploadPhotoFile,
  listPersonalRecords,
};
