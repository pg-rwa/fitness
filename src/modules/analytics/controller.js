const { getDb } = require("../../config/database");

// ─── Workout Analytics ───────────────────────────────────────

function workoutSummary(req, res, next) {
  try {
    const db = getDb();
    const userId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    const { start, end, groupBy } = req.query;

    const startDate = start || new Date(Date.now() - 90 * 86400000).toISOString();
    const endDate = end || new Date().toISOString();

    const group = groupBy === "month" ? "%Y-%m" : groupBy === "year" ? "%Y" : "%Y-%W";

    const data = db
      .prepare(
        `SELECT strftime('${group}', ws.started_at) as period,
         COUNT(ws.id) as workout_count,
         COALESCE(SUM(CAST((julianday(ws.ended_at) - julianday(ws.started_at)) * 24 * 60 AS INTEGER)), 0) as total_minutes,
         COALESCE(SUM(es.reps * es.weight_kg), 0) as total_volume
         FROM workout_sessions ws
         LEFT JOIN session_exercises se ON se.session_id = ws.id
         LEFT JOIN exercise_sets es ON es.session_exercise_id = se.id AND es.completed = 1
         WHERE ws.user_id = ? AND ws.started_at >= ? AND ws.started_at <= ?
         GROUP BY period
         ORDER BY period ASC`
      )
      .all(userId, startDate, endDate);

    res.json({ userId, startDate, endDate, groupBy: groupBy || "week", data });
  } catch (err) {
    next(err);
  }
}

function muscleGroupBreakdown(req, res, next) {
  try {
    const db = getDb();
    const userId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    const { start, end } = req.query;

    const startDate = start || new Date(Date.now() - 30 * 86400000).toISOString();
    const endDate = end || new Date().toISOString();

    const data = db
      .prepare(
        `SELECT e.muscle_group, COUNT(DISTINCT ws.id) as session_count,
         COUNT(se.id) as exercise_count,
         COALESCE(SUM(es.reps * es.weight_kg), 0) as total_volume
         FROM workout_sessions ws
         JOIN session_exercises se ON se.session_id = ws.id
         JOIN exercises e ON e.id = se.exercise_id
         LEFT JOIN exercise_sets es ON es.session_exercise_id = se.id AND es.completed = 1
         WHERE ws.user_id = ? AND ws.started_at >= ? AND ws.started_at <= ?
         GROUP BY e.muscle_group
         ORDER BY total_volume DESC`
      )
      .all(userId, startDate, endDate);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ─── Nutrition Analytics ─────────────────────────────────────

function nutritionSummary(req, res, next) {
  try {
    const db = getDb();
    const userId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    const { start, end } = req.query;

    const startDate = start || new Date(Date.now() - 30 * 86400000).toISOString();
    const endDate = end || new Date().toISOString();

    const data = db
      .prepare(
        `SELECT date(m.logged_at) as date,
         SUM(mi.calories) as total_calories,
         SUM(mi.protein_g) as total_protein,
         SUM(mi.carbs_g) as total_carbs,
         SUM(mi.fat_g) as total_fat,
         COUNT(DISTINCT m.id) as meal_count
         FROM meals m
         JOIN meal_items mi ON mi.meal_id = m.id
         WHERE m.user_id = ? AND m.logged_at >= ? AND m.logged_at <= ?
         GROUP BY date(m.logged_at)
         ORDER BY date ASC`
      )
      .all(userId, startDate, endDate);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ─── Overall Stats ───────────────────────────────────────────

function overallStats(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;

    const workouts = db
      .prepare("SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ?")
      .get(userId);

    const prs = db
      .prepare("SELECT COUNT(*) as count FROM personal_records WHERE user_id = ?")
      .get(userId);

    const meals = db
      .prepare("SELECT COUNT(*) as count FROM meals WHERE user_id = ?")
      .get(userId);

    const measurements = db
      .prepare("SELECT COUNT(*) as count FROM body_measurements WHERE user_id = ?")
      .get(userId);

    const firstWorkout = db
      .prepare("SELECT started_at FROM workout_sessions WHERE user_id = ? ORDER BY started_at ASC LIMIT 1")
      .get(userId);

    const streakDays = db
      .prepare(
        `SELECT COUNT(DISTINCT date(started_at)) as days
         FROM workout_sessions WHERE user_id = ? AND started_at >= datetime('now', '-30 days')`
      )
      .get(userId);

    res.json({
      total_workouts: workouts.count,
      total_prs: prs.count,
      total_meals: meals.count,
      total_measurements: measurements.count,
      member_since: firstWorkout?.started_at || null,
      workout_days_last_30: streakDays.days,
    });
  } catch (err) {
    next(err);
  }
}

// ─── CSV Export ──────────────────────────────────────────────

function exportWorkouts(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { start, end } = req.query;

    let sql = `SELECT ws.id, ws.name, ws.started_at, ws.ended_at, ws.mood_before, ws.mood_after, ws.notes,
               e.name as exercise_name, e.muscle_group,
               es.set_number, es.set_type, es.reps, es.weight_kg, es.duration_sec, es.rpe, es.completed
               FROM workout_sessions ws
               LEFT JOIN session_exercises se ON se.session_id = ws.id
               LEFT JOIN exercises e ON e.id = se.exercise_id
               LEFT JOIN exercise_sets es ON es.session_exercise_id = se.id
               WHERE ws.user_id = ?`;
    const params = [userId];

    if (start) { sql += " AND ws.started_at >= ?"; params.push(start); }
    if (end) { sql += " AND ws.started_at <= ?"; params.push(end); }
    sql += " ORDER BY ws.started_at DESC, se.sort_order, es.set_number";

    const rows = db.prepare(sql).all(...params);

    const headers = [
      "Session ID", "Workout Name", "Started", "Ended", "Mood Before", "Mood After", "Notes",
      "Exercise", "Muscle Group", "Set #", "Set Type", "Reps", "Weight (kg)", "Duration (s)", "RPE", "Completed",
    ];

    const csvRows = rows.map((r) =>
      [
        r.id, csvEscape(r.name), r.started_at, r.ended_at, r.mood_before, r.mood_after,
        csvEscape(r.notes), csvEscape(r.exercise_name), r.muscle_group,
        r.set_number, r.set_type, r.reps, r.weight_kg, r.duration_sec, r.rpe, r.completed,
      ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=workouts.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

function exportNutrition(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const { start, end } = req.query;

    let sql = `SELECT m.id as meal_id, m.meal_type, m.logged_at, m.notes,
               fi.name as food_name, mi.quantity, mi.unit,
               mi.calories, mi.protein_g, mi.carbs_g, mi.fat_g
               FROM meals m
               LEFT JOIN meal_items mi ON mi.meal_id = m.id
               LEFT JOIN food_items fi ON fi.id = mi.food_item_id
               WHERE m.user_id = ?`;
    const params = [userId];

    if (start) { sql += " AND m.logged_at >= ?"; params.push(start); }
    if (end) { sql += " AND m.logged_at <= ?"; params.push(end); }
    sql += " ORDER BY m.logged_at DESC";

    const rows = db.prepare(sql).all(...params);

    const headers = ["Meal ID", "Type", "Logged At", "Notes", "Food", "Qty", "Unit", "Calories", "Protein", "Carbs", "Fat"];
    const csvRows = rows.map((r) =>
      [r.meal_id, r.meal_type, r.logged_at, csvEscape(r.notes), csvEscape(r.food_name), r.quantity, r.unit, r.calories, r.protein_g, r.carbs_g, r.fat_g].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=nutrition.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

function exportMeasurements(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;

    const rows = db
      .prepare("SELECT * FROM body_measurements WHERE user_id = ? ORDER BY recorded_at DESC")
      .all(userId);

    const headers = [
      "ID", "Recorded At", "Weight (kg)", "Body Fat %", "Chest (cm)", "Waist (cm)", "Hips (cm)",
      "L Bicep (cm)", "R Bicep (cm)", "L Thigh (cm)", "R Thigh (cm)", "Neck (cm)", "Notes",
    ];
    const csvRows = rows.map((r) =>
      [
        r.id, r.recorded_at, r.weight_kg, r.body_fat_pct, r.chest_cm, r.waist_cm, r.hips_cm,
        r.bicep_left_cm, r.bicep_right_cm, r.thigh_left_cm, r.thigh_right_cm, r.neck_cm, csvEscape(r.notes),
      ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=measurements.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

function csvEscape(val) {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

module.exports = {
  workoutSummary, muscleGroupBreakdown, nutritionSummary, overallStats,
  exportWorkouts, exportNutrition, exportMeasurements,
};
