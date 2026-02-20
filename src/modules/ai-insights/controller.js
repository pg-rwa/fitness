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

// ─── Data collection helper ────────────────────────────────────

function gatherUserData(db, userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const workoutCount = db
    .prepare("SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND started_at >= ?")
    .get(userId, thirtyDaysAgo);

  const prCount = db
    .prepare("SELECT COUNT(*) as count FROM personal_records WHERE user_id = ? AND achieved_at >= ?")
    .get(userId, thirtyDaysAgo);

  const measurements = db
    .prepare(
      `SELECT weight_kg, body_fat_pct, recorded_at FROM body_measurements
       WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at ASC`
    )
    .all(userId, thirtyDaysAgo);

  const nutritionSummary = db
    .prepare(
      `SELECT AVG(daily_protein) as avg_protein, AVG(daily_calories) as avg_calories FROM (
         SELECT SUM(mli.protein_g) as daily_protein, SUM(mli.calories) as daily_calories
         FROM meal_logs ml
         JOIN meal_log_items mli ON ml.id = mli.meal_log_id
         WHERE ml.user_id = ? AND ml.logged_at >= ?
         GROUP BY date(ml.logged_at)
       )`
    )
    .get(userId, thirtyDaysAgo);

  const goals = db
    .prepare("SELECT * FROM goals WHERE user_id = ? AND status = 'active'")
    .all(userId);

  const recentPRs = db
    .prepare("SELECT * FROM personal_records WHERE user_id = ? AND achieved_at >= ? ORDER BY achieved_at DESC LIMIT 5")
    .all(userId, thirtyDaysAgo);

  return { workoutCount: workoutCount.count, prCount: prCount.count, measurements, nutritionSummary, goals, recentPRs, thirtyDaysAgo };
}

// ─── Rule-based fallback ────────────────────────────────────────

function generateRuleBasedInsights(data) {
  const insights = [];

  if (data.workoutCount >= 12) {
    insights.push({
      type: "habit",
      title: "Consistent Training!",
      body: `You've completed ${data.workoutCount} workouts in the last 30 days. Great consistency!`,
      data: { workoutCount: data.workoutCount },
    });
  } else if (data.workoutCount > 0 && data.workoutCount < 8) {
    insights.push({
      type: "warning",
      title: "Training Frequency",
      body: `You've only completed ${data.workoutCount} workouts in the last 30 days. Try to aim for 3-4 sessions per week.`,
      data: { workoutCount: data.workoutCount },
    });
  }

  if (data.prCount > 0) {
    insights.push({
      type: "milestone",
      title: "Personal Records",
      body: `You've set ${data.prCount} personal record(s) in the last 30 days. Keep pushing!`,
      data: { prCount: data.prCount },
    });
  }

  if (data.measurements.length >= 2) {
    const first = data.measurements[0].weight_kg;
    const last = data.measurements[data.measurements.length - 1].weight_kg;
    if (first && last) {
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
  }

  if (data.nutritionSummary && data.nutritionSummary.avg_protein) {
    const avgProtein = Math.round(data.nutritionSummary.avg_protein);
    insights.push({
      type: "tip",
      title: "Protein Intake",
      body: `Your average daily protein intake is ${avgProtein}g. ${avgProtein < 120 ? "Consider increasing protein for better recovery." : "Great protein intake!"}`,
      data: { avgProteinG: avgProtein },
    });
  }

  return insights;
}

// ─── Claude AI insights ─────────────────────────────────────────

async function generateClaudeInsights(data) {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic();

  const summary = {
    workoutsLast30Days: data.workoutCount,
    personalRecords: data.prCount,
    recentPRs: data.recentPRs.map((pr) => ({ exercise: pr.exercise_name, value: pr.value, metric: pr.metric })),
    weightMeasurements: data.measurements
      .filter((m) => m.weight_kg)
      .map((m) => ({ weight: m.weight_kg, date: m.recorded_at })),
    bodyFatMeasurements: data.measurements
      .filter((m) => m.body_fat_pct)
      .map((m) => ({ bodyFat: m.body_fat_pct, date: m.recorded_at })),
    avgDailyProtein: data.nutritionSummary?.avg_protein ? Math.round(data.nutritionSummary.avg_protein) : null,
    avgDailyCalories: data.nutritionSummary?.avg_calories ? Math.round(data.nutritionSummary.avg_calories) : null,
    activeGoals: data.goals.map((g) => ({ title: g.title, target: g.target_value, current: g.current_value, type: g.type })),
  };

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a fitness coach AI. Analyze this user's fitness data from the last 30 days and generate actionable insights.

Data: ${JSON.stringify(summary)}

Return a JSON array of insights. Each insight must have:
- "type": one of "habit", "warning", "milestone", "trend", "tip", "recommendation"
- "title": short title (max 50 chars)
- "body": detailed insight (1-2 sentences, motivational and specific)
- "data": relevant data points as an object

Generate 2-5 insights based on what the data shows. Focus on actionable advice, trends, and encouragement. If data is sparse, give general tips.

Return ONLY valid JSON, no markdown or extra text.`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  // Parse JSON, stripping any markdown code fences
  const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

// ─── Generate insights endpoint ─────────────────────────────────

async function generateInsights(req, res, next) {
  try {
    const db = getDb();
    const userId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;

    if (req.params.clientId && req.userRole !== "admin" && req.userRole !== "trainer") {
      throw new ForbiddenError();
    }

    const data = gatherUserData(db, userId);
    let insights;

    // Use Claude API if configured, otherwise fall back to rule-based
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        insights = await generateClaudeInsights(data);
      } catch (err) {
        console.error("[ai-insights] Claude API error, falling back to rules:", err.message);
        insights = generateRuleBasedInsights(data);
      }
    } else {
      insights = generateRuleBasedInsights(data);
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
