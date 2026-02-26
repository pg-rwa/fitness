const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError, ValidationError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

// ─── Availability ────────────────────────────────────────────

function getAvailability(req, res, next) {
  try {
    const db = getDb();
    const trainerId = req.params.trainerId ? parseInt(req.params.trainerId, 10) : req.userId;
    const slots = db
      .prepare("SELECT * FROM trainer_availability WHERE trainer_id = ? AND is_active = 1 ORDER BY day_of_week, start_time")
      .all(trainerId);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

function setAvailability(req, res, next) {
  try {
    const db = getDb();
    const { slots } = req.body;

    db.transaction(() => {
      // Deactivate all existing
      db.prepare("UPDATE trainer_availability SET is_active = 0 WHERE trainer_id = ?").run(req.userId);

      // Insert new slots
      const insert = db.prepare(
        `INSERT INTO trainer_availability (trainer_id, day_of_week, start_time, end_time, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(trainer_id, day_of_week, start_time) DO UPDATE SET end_time = excluded.end_time, is_active = 1`
      );

      for (const slot of slots) {
        insert.run(req.userId, slot.dayOfWeek, slot.startTime, slot.endTime);
      }
    })();

    const result = db
      .prepare("SELECT * FROM trainer_availability WHERE trainer_id = ? AND is_active = 1 ORDER BY day_of_week, start_time")
      .all(req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Sessions ────────────────────────────────────────────────

function isSlotAvailable(db, trainerId, scheduledStart, scheduledEnd, excludeId) {
  let sql = `SELECT COUNT(*) as count FROM scheduled_sessions
    WHERE trainer_id = ? AND status NOT IN ('cancelled', 'declined')
    AND scheduled_start < ? AND scheduled_end > ?`;
  const params = [trainerId, scheduledEnd, scheduledStart];

  if (excludeId) {
    sql += " AND id != ?";
    params.push(excludeId);
  }

  const { count } = db.prepare(sql).get(...params);
  return count === 0;
}

async function createSession(req, res, next) {
  try {
    const db = getDb();
    const { trainerId, clientId, templateId, title, scheduledStart, scheduledEnd, location, notes } = req.body;

    const resolvedTrainerId = trainerId || (req.userRole === "trainer" ? req.userId : null);
    const resolvedClientId = clientId || (req.userRole === "client" ? req.userId : null);

    if (!resolvedTrainerId || !resolvedClientId) {
      throw new ValidationError("Both trainer and client must be specified");
    }

    // Check no double-booking
    if (!isSlotAvailable(db, resolvedTrainerId, scheduledStart, scheduledEnd)) {
      throw new ValidationError("Trainer is not available at this time");
    }

    const requestedBy = req.userRole === "client" ? "client" : "trainer";
    const status = requestedBy === "trainer" ? "approved" : "requested";

    const result = db
      .prepare(
        `INSERT INTO scheduled_sessions (trainer_id, client_id, template_id, title, scheduled_start, scheduled_end, status, requested_by, location, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(resolvedTrainerId, resolvedClientId, templateId || null, title, scheduledStart, scheduledEnd, status, requestedBy, location || null, notes || null);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(result.lastInsertRowid);
    await eventBus.emit("session.requested", { session, requestedBy: req.userId });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

function listSessions(req, res, next) {
  try {
    const db = getDb();
    const { status, start, end } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    let sql, countSql;
    const params = [];

    const selectCols = `ss.*, u_trainer.first_name || ' ' || u_trainer.last_name as trainer_name, u_client.first_name || ' ' || u_client.last_name as client_name`;
    const joins = ` JOIN users u_trainer ON ss.trainer_id = u_trainer.id JOIN users u_client ON ss.client_id = u_client.id`;

    if (req.userRole === "trainer" || req.userRole === "admin") {
      sql = `SELECT ${selectCols} FROM scheduled_sessions ss${joins} WHERE ss.trainer_id = ?`;
      countSql = "SELECT COUNT(*) as total FROM scheduled_sessions ss WHERE ss.trainer_id = ?";
      params.push(req.userId);
    } else {
      sql = `SELECT ${selectCols} FROM scheduled_sessions ss${joins} WHERE ss.client_id = ?`;
      countSql = "SELECT COUNT(*) as total FROM scheduled_sessions ss WHERE ss.client_id = ?";
      params.push(req.userId);
    }

    if (status) {
      sql += " AND ss.status = ?";
      countSql += " AND ss.status = ?";
      params.push(status);
    }
    if (start) {
      sql += " AND ss.scheduled_start >= ?";
      countSql += " AND ss.scheduled_start >= ?";
      params.push(start);
    }
    if (end) {
      sql += " AND ss.scheduled_end <= ?";
      countSql += " AND ss.scheduled_end <= ?";
      params.push(end);
    }

    const { total } = db.prepare(countSql).get(...params);
    sql += " ORDER BY ss.scheduled_start ASC" + pagSql;
    const data = db.prepare(sql).all(...params);

    res.json(paginatedResponse(data, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

async function approveSession(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ? AND trainer_id = ?").get(id, req.userId);
    if (!session) throw new NotFoundError("Scheduled session");
    if (session.status !== "requested") throw new ValidationError("Can only approve requested sessions");

    db.prepare("UPDATE scheduled_sessions SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    await eventBus.emit("session.approved", { session: updated });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function declineSession(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ? AND trainer_id = ?").get(id, req.userId);
    if (!session) throw new NotFoundError("Scheduled session");
    if (!["requested", "proposed"].includes(session.status)) throw new ValidationError("Can only decline requested or proposed sessions");

    const { reason } = req.body || {};
    db.prepare("UPDATE scheduled_sessions SET status = 'declined', decline_reason = ?, updated_at = datetime('now') WHERE id = ?").run(reason || null, id);
    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    await eventBus.emit("session.declined", { session: updated });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function proposeSession(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ? AND trainer_id = ?").get(id, req.userId);
    if (!session) throw new NotFoundError("Scheduled session");
    if (session.status !== "requested") throw new ValidationError("Can only propose changes to requested sessions");

    const { scheduledStart, scheduledEnd, reason } = req.body;

    if (!isSlotAvailable(db, req.userId, scheduledStart, scheduledEnd, id)) {
      throw new ValidationError("Proposed time conflicts with another session");
    }

    db.prepare(
      `UPDATE scheduled_sessions SET scheduled_start = ?, scheduled_end = ?, status = 'proposed', decline_reason = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(scheduledStart, scheduledEnd, reason || "Trainer proposed a new time", id);

    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    await eventBus.emit("session.proposed", { session: updated });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function acceptProposal(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ? AND client_id = ?").get(id, req.userId);
    if (!session) throw new NotFoundError("Scheduled session");
    if (session.status !== "proposed") throw new ValidationError("Can only accept proposed sessions");

    db.prepare("UPDATE scheduled_sessions SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    await eventBus.emit("session.approved", { session: updated });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function declineProposal(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ? AND client_id = ?").get(id, req.userId);
    if (!session) throw new NotFoundError("Scheduled session");
    if (session.status !== "proposed") throw new ValidationError("Can only decline proposed sessions");

    db.prepare("UPDATE scheduled_sessions SET status = 'declined', updated_at = datetime('now') WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function cancelSession(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    if (!session) throw new NotFoundError("Scheduled session");

    // Both trainer and client can cancel
    if (session.trainer_id !== req.userId && session.client_id !== req.userId && req.userRole !== "admin") {
      throw new ForbiddenError();
    }

    if (["completed", "cancelled"].includes(session.status)) {
      throw new ValidationError("Cannot cancel this session");
    }

    db.prepare("UPDATE scheduled_sessions SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    await eventBus.emit("session.cancelled", { session: updated, cancelledBy: req.userId });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function completeSession(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    const session = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ? AND trainer_id = ?").get(id, req.userId);
    if (!session) throw new NotFoundError("Scheduled session");
    if (session.status !== "approved") throw new ValidationError("Can only complete approved sessions");

    db.prepare("UPDATE scheduled_sessions SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(id);
    const updated = db.prepare("SELECT * FROM scheduled_sessions WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function getAvailableSlots(req, res, next) {
  try {
    const db = getDb();
    const { trainerId, date } = req.query;

    if (!trainerId || !date) {
      throw new ValidationError("trainerId and date are required");
    }

    const dayOfWeek = new Date(date).getDay();
    const slots = db
      .prepare("SELECT * FROM trainer_availability WHERE trainer_id = ? AND day_of_week = ? AND is_active = 1 ORDER BY start_time")
      .all(parseInt(trainerId, 10), dayOfWeek);

    // Filter out booked slots
    const available = slots.filter((slot) => {
      const start = `${date}T${slot.start_time}:00`;
      const end = `${date}T${slot.end_time}:00`;
      return isSlotAvailable(db, parseInt(trainerId, 10), start, end);
    });

    res.json(available);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAvailability, setAvailability,
  createSession, listSessions, approveSession, declineSession, cancelSession, completeSession,
  proposeSession, acceptProposal, declineProposal,
  getAvailableSlots,
};
