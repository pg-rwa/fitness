const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

function list(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;

    if (targetUserId !== req.userId && req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(targetUserId);
      if (!client || client.trainer_id !== req.userId) throw new ForbiddenError();
    }

    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    const countSql = "SELECT COUNT(*) as total FROM ai_insights WHERE user_id = ?";
    const { total } = db.prepare(countSql).get(targetUserId);

    const data = db
      .prepare(`SELECT * FROM ai_insights WHERE user_id = ? ORDER BY generated_at DESC${pagSql}`)
      .all(targetUserId);

    const parsed = data.map((i) => ({ ...i, data: JSON.parse(i.data || "{}") }));
    res.json(paginatedResponse(parsed, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function markRead(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    const insight = db.prepare("SELECT * FROM ai_insights WHERE id = ? AND user_id = ?").get(id, req.userId);
    if (!insight) throw new NotFoundError("Insight");

    db.prepare("UPDATE ai_insights SET is_read = 1 WHERE id = ?").run(id);
    res.json({ ...insight, is_read: 1, data: JSON.parse(insight.data || "{}") });
  } catch (err) {
    next(err);
  }
}

/**
 * Generate insights for a user based on their recent data.
 * In production, this would call the Claude API. For now, it uses rule-based generation.
 */
async function generateInsights(req, res, next) {
  try {
    const db = getDb();
    const userId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;

    // Only trainers/admins can trigger insight generation for clients
    if (req.params.clientId && req.userRole !== "admin" && req.userRole !== "trainer") {
      throw new ForbiddenError();
    }

    const insights = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Workout frequency insight
    const workoutCount = db
      .prepare("SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND started_at >= ?")
      .get(userId, thirtyDaysAgo);

    if (workoutCount.count >= 12) {
      insights.push({
        type: "habit",
        title: "Consistent Training!",
        body: `You've completed ${workoutCount.count} workouts in the last 30 days. Great consistency!`,
        data: { workoutCount: workoutCount.count },
      });
    } else if (workoutCount.count > 0 && workoutCount.count < 8) {
      insights.push({
        type: "warning",
        title: "Training Frequency",
        body: `You've only completed ${workoutCount.count} workouts in the last 30 days. Try to aim for 3-4 sessions per week.`,
        data: { workoutCount: workoutCount.count },
      });
    }

    // Personal records insight
    const prCount = db
      .prepare("SELECT COUNT(*) as count FROM personal_records WHERE user_id = ? AND achieved_at >= ?")
      .get(userId, thirtyDaysAgo);

    if (prCount.count > 0) {
      insights.push({
        type: "milestone",
        title: "Personal Records",
        body: `You've set ${prCount.count} personal record(s) in the last 30 days. Keep pushing!`,
        data: { prCount: prCount.count },
      });
    }

    // Weight trend insight
    const measurements = db
      .prepare(
        `SELECT weight_kg, recorded_at FROM body_measurements
         WHERE user_id = ? AND weight_kg IS NOT NULL AND recorded_at >= ?
         ORDER BY recorded_at ASC`
      )
      .all(userId, thirtyDaysAgo);

    if (measurements.length >= 2) {
      const first = measurements[0].weight_kg;
      const last = measurements[measurements.length - 1].weight_kg;
      const diff = Math.round((last - first) * 10) / 10;

      if (Math.abs(diff) >= 0.5) {
        insights.push({
          type: "trend",
          title: "Weight Trend",
          body: `Your weight has ${diff > 0 ? "increased" : "decreased"} by ${Math.abs(diff)} kg over the last 30 days.`,
          data: { weightChange: diff, startWeight: first, currentWeight: last },
        });
      }
    }

    // Nutrition insight
    const nutritionSummary = db
      .prepare(
        `SELECT AVG(daily_protein) as avg_protein FROM (
           SELECT SUM(mli.protein_g) as daily_protein
           FROM meal_logs ml
           JOIN meal_log_items mli ON ml.id = mli.meal_log_id
           WHERE ml.user_id = ? AND ml.logged_at >= ?
           GROUP BY date(ml.logged_at)
         )`
      )
      .get(userId, thirtyDaysAgo);

    if (nutritionSummary && nutritionSummary.avg_protein) {
      const avgProtein = Math.round(nutritionSummary.avg_protein);
      insights.push({
        type: "tip",
        title: "Protein Intake",
        body: `Your average daily protein intake is ${avgProtein}g. ${avgProtein < 120 ? "Consider increasing protein for better recovery." : "Great protein intake!"}`,
        data: { avgProteinG: avgProtein },
      });
    }

    // Store insights
    const insert = db.prepare(
      `INSERT INTO ai_insights (user_id, type, title, body, data, expires_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', '+30 days'))`
    );

    const stored = db.transaction(() => {
      return insights.map((i) => {
        const result = insert.run(userId, i.type, i.title, i.body, JSON.stringify(i.data || {}));
        return { id: result.lastInsertRowid, ...i };
      });
    })();

    await eventBus.emit("insight.generated", { insights: stored, userId });
    res.status(201).json(stored);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, generateInsights };
