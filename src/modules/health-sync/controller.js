const { getDb } = require("../../config/database");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");

const VALID_SOURCES = ["apple_health", "google_fit", "fitbit", "garmin", "manual"];
const VALID_METRICS = ["steps", "heart_rate", "sleep_hours", "calories_burned", "active_minutes", "resting_heart_rate"];

function batchUpload(req, res, next) {
  try {
    const db = getDb();
    const { records } = req.body;

    const insert = db.prepare(
      `INSERT INTO health_sync_records (user_id, source, metric_type, value, unit, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const inserted = db.transaction(() => {
      const ids = [];
      for (const r of records) {
        const result = insert.run(
          req.userId,
          r.source || "manual",
          r.metricType,
          r.value,
          r.unit,
          r.recordedAt
        );
        ids.push(result.lastInsertRowid);
      }
      return ids;
    })();

    res.status(201).json({ inserted: inserted.length });
  } catch (err) {
    next(err);
  }
}

function queryRecords(req, res, next) {
  try {
    const db = getDb();
    const { metric, source, start, end } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    let sql = "SELECT * FROM health_sync_records WHERE user_id = ?";
    let countSql = "SELECT COUNT(*) as total FROM health_sync_records WHERE user_id = ?";
    const params = [req.userId];

    if (metric) {
      sql += " AND metric_type = ?";
      countSql += " AND metric_type = ?";
      params.push(metric);
    }
    if (source) {
      sql += " AND source = ?";
      countSql += " AND source = ?";
      params.push(source);
    }
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

function dailySummary(req, res, next) {
  try {
    const db = getDb();
    const { date } = req.query;
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const metrics = db
      .prepare(
        `SELECT metric_type,
                CASE
                  WHEN metric_type IN ('steps', 'calories_burned', 'active_minutes') THEN SUM(value)
                  WHEN metric_type IN ('sleep_hours') THEN SUM(value)
                  ELSE AVG(value)
                END as value,
                unit
         FROM health_sync_records
         WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ?
         GROUP BY metric_type`
      )
      .all(req.userId, startOfDay, endOfDay);

    const summary = {};
    for (const m of metrics) {
      summary[m.metric_type] = { value: Math.round(m.value * 100) / 100, unit: m.unit };
    }

    res.json({ date, summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { batchUpload, queryRecords, dailySummary, VALID_SOURCES, VALID_METRICS };
