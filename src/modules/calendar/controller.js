const { getDb } = require("../../config/database");

function getEvents(req, res, next) {
  try {
    const db = getDb();
    const { start, end } = req.query;
    const userId = req.userId;
    const events = [];

    // Workout sessions (completed and in-progress)
    const sessions = db
      .prepare(
        `SELECT id, name, started_at as datetime, ended_at,
                CASE WHEN ended_at IS NOT NULL THEN 'completed' ELSE 'in_progress' END as status
         FROM workout_sessions
         WHERE user_id = ? AND started_at >= ? AND started_at <= ?
         ORDER BY started_at`
      )
      .all(userId, start, end);

    for (const s of sessions) {
      events.push({
        type: "workout_session",
        title: s.name,
        datetime: s.datetime,
        status: s.status,
        entity_id: s.id,
      });
    }

    // Body measurements
    const measurements = db
      .prepare(
        `SELECT id, recorded_at as datetime
         FROM body_measurements
         WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ?
         ORDER BY recorded_at`
      )
      .all(userId, start, end);

    for (const m of measurements) {
      events.push({
        type: "measurement",
        title: "Body Measurement",
        datetime: m.datetime,
        status: "recorded",
        entity_id: m.id,
      });
    }

    // Progress photos
    const photos = db
      .prepare(
        `SELECT id, category, taken_at as datetime
         FROM progress_photos
         WHERE user_id = ? AND taken_at >= ? AND taken_at <= ?
         ORDER BY taken_at`
      )
      .all(userId, start, end);

    for (const p of photos) {
      events.push({
        type: "progress_photo",
        title: `Progress Photo (${p.category})`,
        datetime: p.datetime,
        status: "recorded",
        entity_id: p.id,
      });
    }

    // Scheduled sessions (appointments with trainer/client)
    const isTrainer = req.userRole === "trainer" || req.userRole === "admin";
    const scheduledCol = isTrainer ? "ss.trainer_id" : "ss.client_id";
    const otherCol = isTrainer ? "ss.client_id" : "ss.trainer_id";
    const scheduled = db
      .prepare(
        `SELECT ss.id, ss.title, ss.scheduled_start as datetime, ss.status,
                u.first_name || ' ' || u.last_name as other_name
         FROM scheduled_sessions ss
         JOIN users u ON u.id = ${otherCol}
         WHERE ${scheduledCol} = ? AND ss.status NOT IN ('cancelled', 'declined')
           AND ss.scheduled_start >= ? AND ss.scheduled_start <= ?
         ORDER BY ss.scheduled_start`
      )
      .all(userId, start, end);

    for (const s of scheduled) {
      events.push({
        type: "scheduled_session",
        title: `${s.title} (${s.other_name})`,
        datetime: s.datetime,
        status: s.status,
        entity_id: s.id,
      });
    }

    // Assigned workouts (recurring by day_of_week)
    const assignments = db
      .prepare(
        `SELECT aw.id, wt.name, aw.day_of_week
         FROM assigned_workouts aw
         JOIN workout_templates wt ON aw.template_id = wt.id
         WHERE aw.client_id = ? AND aw.is_active = 1 AND aw.day_of_week IS NOT NULL`
      )
      .all(userId);

    if (assignments.length > 0) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        for (const a of assignments) {
          if (a.day_of_week === dayOfWeek) {
            events.push({
              type: "assigned_workout",
              title: a.name,
              datetime: d.toISOString().split("T")[0] + "T00:00:00.000Z",
              status: "scheduled",
              entity_id: a.id,
            });
          }
        }
      }
    }

    // Sort all events by datetime
    events.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    res.json(events);
  } catch (err) {
    next(err);
  }
}

module.exports = { getEvents };
