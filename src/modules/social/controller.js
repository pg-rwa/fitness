const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

// ─── Challenges ──────────────────────────────────────────────

function createChallenge(req, res, next) {
  try {
    const db = getDb();
    const { title, description, type, targetValue, unit, startDate, endDate, isPublic } = req.body;

    const result = db
      .prepare(
        `INSERT INTO challenges (title, description, type, target_value, unit, start_date, end_date, created_by, is_public)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title,
        description || null,
        type || "workout_count",
        targetValue || 1,
        unit || "workouts",
        startDate,
        endDate,
        req.userId,
        isPublic !== false ? 1 : 0
      );

    const challenge = db.prepare("SELECT * FROM challenges WHERE id = ?").get(result.lastInsertRowid);

    // Auto-join the creator
    db.prepare("INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)").run(challenge.id, req.userId);

    eventBus.emit("challenge.created", { challenge, userId: req.userId });
    res.status(201).json(challenge);
  } catch (err) {
    next(err);
  }
}

function listChallenges(req, res, next) {
  try {
    const db = getDb();
    const { status, joined } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    let sql = `SELECT c.*, u.first_name || ' ' || u.last_name as creator_name,
               (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count,
               (SELECT id FROM challenge_participants WHERE challenge_id = c.id AND user_id = ?) as my_participation_id
               FROM challenges c
               JOIN users u ON u.id = c.created_by
               WHERE (c.is_public = 1 OR c.created_by = ?)`;
    let countSql = `SELECT COUNT(*) as total FROM challenges c WHERE (c.is_public = 1 OR c.created_by = ?)`;
    const params = [req.userId, req.userId];
    const countParams = [req.userId];

    if (status) {
      sql += " AND c.status = ?";
      countSql += " AND c.status = ?";
      params.push(status);
      countParams.push(status);
    }

    if (joined === "true") {
      sql += " AND EXISTS (SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = c.id AND cp.user_id = ?)";
      countSql += " AND EXISTS (SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = c.id AND cp.user_id = ?)";
      params.push(req.userId);
      countParams.push(req.userId);
    }

    const { total } = db.prepare(countSql).get(...countParams);
    sql += " ORDER BY c.created_at DESC" + pagSql;
    const data = db.prepare(sql).all(...params);

    res.json(paginatedResponse(data, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function getChallenge(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const challenge = db
      .prepare(
        `SELECT c.*, u.first_name || ' ' || u.last_name as creator_name
         FROM challenges c JOIN users u ON u.id = c.created_by WHERE c.id = ?`
      )
      .get(id);
    if (!challenge) throw new NotFoundError("Challenge");

    const participants = db
      .prepare(
        `SELECT cp.*, u.first_name || ' ' || u.last_name as name
         FROM challenge_participants cp
         JOIN users u ON u.id = cp.user_id
         WHERE cp.challenge_id = ?
         ORDER BY cp.current_value DESC`
      )
      .all(id);

    res.json({ ...challenge, participants });
  } catch (err) {
    next(err);
  }
}

function joinChallenge(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const challenge = db.prepare("SELECT * FROM challenges WHERE id = ?").get(id);
    if (!challenge) throw new NotFoundError("Challenge");
    if (challenge.status !== "active") {
      return res.status(400).json({ error: "Challenge is not active" });
    }

    const existing = db
      .prepare("SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?")
      .get(id, req.userId);
    if (existing) {
      return res.status(400).json({ error: "Already joined this challenge" });
    }

    db.prepare("INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)").run(id, req.userId);
    eventBus.emit("challenge.joined", { challengeId: id, userId: req.userId });
    res.status(201).json({ message: "Joined challenge" });
  } catch (err) {
    next(err);
  }
}

function leaveChallenge(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const participation = db
      .prepare("SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?")
      .get(id, req.userId);
    if (!participation) throw new NotFoundError("Participation");

    db.prepare("DELETE FROM challenge_participants WHERE challenge_id = ? AND user_id = ?").run(id, req.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function updateProgress(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    const { value } = req.body;

    const participation = db
      .prepare("SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?")
      .get(id, req.userId);
    if (!participation) throw new NotFoundError("Participation");

    const challenge = db.prepare("SELECT * FROM challenges WHERE id = ?").get(id);

    const newValue = (participation.current_value || 0) + (value || 1);
    const completed = newValue >= challenge.target_value;

    db.prepare(
      `UPDATE challenge_participants SET current_value = ?, completed_at = ? WHERE challenge_id = ? AND user_id = ?`
    ).run(newValue, completed ? new Date().toISOString() : null, id, req.userId);

    if (completed) {
      eventBus.emit("challenge.completed", { challengeId: id, userId: req.userId });
    }

    res.json({ current_value: newValue, completed });
  } catch (err) {
    next(err);
  }
}

// ─── Leaderboard ─────────────────────────────────────────────

function leaderboard(req, res, next) {
  try {
    const db = getDb();
    const { period, metric } = req.query;

    let startDate;
    const now = new Date();
    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    } else {
      // Default: week
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      startDate = d.toISOString();
    }

    let data;
    if (metric === "volume") {
      data = db
        .prepare(
          `SELECT u.id as user_id, u.first_name || ' ' || u.last_name as name,
           COALESCE(SUM(es.reps * es.weight_kg), 0) as score
           FROM users u
           LEFT JOIN workout_sessions ws ON ws.user_id = u.id AND ws.started_at >= ?
           LEFT JOIN session_exercises se ON se.session_id = ws.id
           LEFT JOIN exercise_sets es ON es.session_exercise_id = se.id AND es.completed = 1
           WHERE u.status = 'active'
           GROUP BY u.id
           ORDER BY score DESC
           LIMIT 50`
        )
        .all(startDate);
    } else if (metric === "streak") {
      // Count distinct workout days
      data = db
        .prepare(
          `SELECT u.id as user_id, u.first_name || ' ' || u.last_name as name,
           COUNT(DISTINCT date(ws.started_at)) as score
           FROM users u
           LEFT JOIN workout_sessions ws ON ws.user_id = u.id AND ws.started_at >= ?
           WHERE u.status = 'active'
           GROUP BY u.id
           ORDER BY score DESC
           LIMIT 50`
        )
        .all(startDate);
    } else {
      // Default: workout count
      data = db
        .prepare(
          `SELECT u.id as user_id, u.first_name || ' ' || u.last_name as name,
           COUNT(ws.id) as score
           FROM users u
           LEFT JOIN workout_sessions ws ON ws.user_id = u.id AND ws.started_at >= ?
           WHERE u.status = 'active'
           GROUP BY u.id
           ORDER BY score DESC
           LIMIT 50`
        )
        .all(startDate);
    }

    // Add rank
    const ranked = data.map((row, i) => ({ ...row, rank: i + 1 }));
    res.json({ period: period || "week", metric: metric || "workouts", leaderboard: ranked });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createChallenge, listChallenges, getChallenge,
  joinChallenge, leaveChallenge, updateProgress,
  leaderboard,
};
