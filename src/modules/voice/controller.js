const { getDb } = require("../../config/database");
const { BadRequestError, NotFoundError } = require("../../shared/utils/errors");
const { eventBus } = require("../../shared/services/event-bus");

// ─── Peqo personality system prompt ────────────────────────────

const PEQO_SYSTEM_PROMPT = `You are Peqo, an AI fitness companion. You're a small, expressive character that lives on the user's phone. You're motivational, concise, and knowledgeable about fitness.

Your personality adapts but you're always:
- Encouraging but honest
- Concise (1-2 sentences for voice responses)
- Action-oriented — you do things, not just talk about them

You process voice commands during workouts. Given the user's command and their current workout context, determine what action to take.

Respond with a JSON object:
{
  "action": "one of: log_set, complete_set, skip_exercise, complete_workout, add_exercise, get_status, adjust_weight, rest_timer, encouragement, general",
  "params": { action-specific parameters },
  "response": "What Peqo says back to the user (short, conversational)",
  "mood": "one of: happy, celebrating, motivated, concerned, thinking, idle"
}

Action params:
- log_set: { "reps": number, "weight_kg": number, "rpe": number|null }
- complete_set: {} (marks current set as done with existing values)
- skip_exercise: { "reason": string|null }
- complete_workout: { "mood_after": number 1-10 }
- add_exercise: { "exercise_name": string }
- get_status: {}
- adjust_weight: { "change_kg": number } (positive = increase, negative = decrease)
- rest_timer: { "seconds": number }
- encouragement: {}
- general: { "topic": string }

Be smart about interpreting natural language:
- "Done" / "Next" → complete_set
- "That was heavy" / "RPE 9" → log_set with RPE
- "Skip" / "Pass" → skip_exercise
- "I'm done" / "Finish" → complete_workout
- "How am I doing?" → get_status
- "Add bench press" → add_exercise
- "More weight" / "Go heavier" → adjust_weight (positive)
- "Lighter" / "Drop weight" → adjust_weight (negative)
- Numbers like "10 at 80" → log_set with reps=10, weight=80

Return ONLY valid JSON, no markdown.`;

// ─── Gather workout context ────────────────────────────────────

function getActiveSession(db, userId) {
  return db
    .prepare(
      `SELECT ws.*, wt.name as template_name
       FROM workout_sessions ws
       LEFT JOIN workout_templates wt ON ws.template_id = wt.id
       WHERE ws.user_id = ? AND ws.ended_at IS NULL
       ORDER BY ws.started_at DESC
       LIMIT 1`
    )
    .get(userId);
}

function getSessionExercises(db, sessionId) {
  return db
    .prepare(
      `SELECT se.*, e.name as exercise_name, e.muscle_group, e.equipment_type
       FROM session_exercises se
       JOIN exercises e ON se.exercise_id = e.id
       WHERE se.session_id = ?
       ORDER BY se.order_index ASC`
    )
    .all(sessionId);
}

function getExerciseSets(db, sessionExerciseId) {
  return db
    .prepare(
      `SELECT * FROM exercise_sets
       WHERE session_exercise_id = ?
       ORDER BY set_number ASC`
    )
    .all(sessionExerciseId);
}

function getRecentPerformance(db, userId, exerciseId) {
  return db
    .prepare(
      `SELECT es.reps, es.weight_kg, es.rpe, ws.started_at
       FROM exercise_sets es
       JOIN session_exercises se ON es.session_exercise_id = se.id
       JOIN workout_sessions ws ON se.session_id = ws.id
       WHERE ws.user_id = ? AND se.exercise_id = ? AND ws.ended_at IS NOT NULL
       ORDER BY ws.started_at DESC
       LIMIT 5`
    )
    .all(userId, exerciseId);
}

function buildWorkoutContext(db, userId) {
  const session = getActiveSession(db, userId);
  if (!session) return { hasActiveSession: false };

  const exercises = getSessionExercises(db, session.id);
  const exercisesWithSets = exercises.map((ex) => {
    const sets = getExerciseSets(db, ex.id);
    const completedSets = sets.filter((s) => s.completed);
    const recentPerf = getRecentPerformance(db, userId, ex.exercise_id);
    return {
      id: ex.id,
      exerciseId: ex.exercise_id,
      name: ex.exercise_name,
      muscleGroup: ex.muscle_group,
      equipment: ex.equipment_type,
      sets,
      completedCount: completedSets.length,
      totalSets: sets.length,
      lastPerformance: recentPerf[0] || null,
    };
  });

  // Find current exercise (first one not fully completed)
  const currentExercise = exercisesWithSets.find(
    (ex) => ex.completedCount < ex.totalSets || ex.totalSets === 0
  );

  return {
    hasActiveSession: true,
    sessionId: session.id,
    sessionName: session.template_name || session.name || "Workout",
    startedAt: session.started_at,
    exercises: exercisesWithSets,
    currentExercise: currentExercise || null,
    totalExercises: exercises.length,
    completedExercises: exercisesWithSets.filter((ex) => ex.totalSets > 0 && ex.completedCount >= ex.totalSets).length,
  };
}

// ─── Process voice command via Claude ──────────────────────────

async function processWithClaude(command, context) {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic();

  const contextStr = context.hasActiveSession
    ? `Active workout: "${context.sessionName}" (started ${context.startedAt}).
Exercises: ${context.exercises.map((e) => `${e.name} (${e.completedCount}/${e.totalSets} sets done)`).join(", ")}.
Current exercise: ${context.currentExercise ? `${context.currentExercise.name} — ${context.currentExercise.completedCount}/${context.currentExercise.totalSets} sets completed${context.currentExercise.lastPerformance ? `. Last time: ${context.currentExercise.lastPerformance.reps} reps @ ${context.currentExercise.lastPerformance.weight_kg}kg` : ""}` : "All exercises completed"}.
Progress: ${context.completedExercises}/${context.totalExercises} exercises done.`
    : "No active workout session.";

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    system: PEQO_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Workout context:\n${contextStr}\n\nUser says: "${command}"`,
      },
    ],
  });

  const text = message.content[0].text.trim();
  const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

// ─── Fallback intent parser (no API key) ───────────────────────

function parseCommandFallback(command, context) {
  const lower = command.toLowerCase().trim();

  // Complete set
  if (/^(done|next|finished|complete)$/i.test(lower)) {
    return {
      action: "complete_set",
      params: {},
      response: context.currentExercise
        ? `Set done! ${context.currentExercise.completedCount + 1} down.`
        : "Set logged!",
      mood: "happy",
    };
  }

  // Skip
  if (/^(skip|pass|skip this)/i.test(lower)) {
    return {
      action: "skip_exercise",
      params: { reason: null },
      response: "Skipped. Moving on!",
      mood: "idle",
    };
  }

  // Finish workout
  if (/^(i'm done|finish|end workout|stop|that's it)/i.test(lower)) {
    return {
      action: "complete_workout",
      params: { mood_after: 7 },
      response: "Great session! Let's wrap it up.",
      mood: "celebrating",
    };
  }

  // Reps + weight: "10 at 80", "8 reps 60kg", "12x100"
  const repWeight = lower.match(/(\d+)\s*(?:at|@|x|reps?\s*(?:at|@)?\s*)\s*(\d+(?:\.\d+)?)/);
  if (repWeight) {
    return {
      action: "log_set",
      params: { reps: parseInt(repWeight[1]), weight_kg: parseFloat(repWeight[2]), rpe: null },
      response: `Logged ${repWeight[1]} reps at ${repWeight[2]}kg.`,
      mood: "happy",
    };
  }

  // Status check
  if (/how.*(doing|going|am i|progress|left)/i.test(lower)) {
    if (context.hasActiveSession) {
      return {
        action: "get_status",
        params: {},
        response: `${context.completedExercises}/${context.totalExercises} exercises done. ${context.currentExercise ? `Currently on ${context.currentExercise.name}.` : "All done!"}`,
        mood: "motivated",
      };
    }
    return { action: "get_status", params: {}, response: "No active workout. Ready to start one?", mood: "idle" };
  }

  // Encouragement
  if (/hard|heavy|tough|struggling|can't/i.test(lower)) {
    return {
      action: "encouragement",
      params: {},
      response: "You've got this! One rep at a time. Strength is built in the struggle.",
      mood: "motivated",
    };
  }

  // General fallback
  return {
    action: "general",
    params: { topic: command },
    response: "Got it! Let me know what you need.",
    mood: "thinking",
  };
}

// ─── Execute the parsed action ─────────────────────────────────

function executeAction(db, userId, context, parsed) {
  const { action, params } = parsed;

  switch (action) {
    case "log_set": {
      if (!context.hasActiveSession || !context.currentExercise) break;
      const se = context.currentExercise;
      const nextSetNum = se.completedCount + 1;
      db.prepare(
        `INSERT INTO exercise_sets (session_exercise_id, set_number, reps, weight_kg, rpe, completed)
         VALUES (?, ?, ?, ?, ?, 1)`
      ).run(se.id, nextSetNum, params.reps || 0, params.weight_kg || 0, params.rpe || null);

      // Check for PR
      const pr = db
        .prepare(
          `SELECT MAX(weight_kg) as max_weight FROM exercise_sets es
           JOIN session_exercises se ON es.session_exercise_id = se.id
           JOIN workout_sessions ws ON se.session_id = ws.id
           WHERE ws.user_id = ? AND se.exercise_id = ? AND es.completed = 1`
        )
        .get(userId, se.exerciseId);

      if (pr && params.weight_kg > pr.max_weight) {
        parsed.mood = "celebrating";
        parsed.response += " NEW PR! That's a personal record!";
        eventBus.emit("personal_record.set", {
          userId,
          exerciseName: se.name,
          value: params.weight_kg,
          metric: "weight_kg",
        });
      }
      break;
    }

    case "complete_set": {
      if (!context.hasActiveSession || !context.currentExercise) break;
      const se = context.currentExercise;
      // Find the next incomplete set
      const incompleteSet = se.sets.find((s) => !s.completed);
      if (incompleteSet) {
        db.prepare("UPDATE exercise_sets SET completed = 1 WHERE id = ?").run(incompleteSet.id);
      } else {
        // Add a new completed set
        const nextSetNum = se.sets.length + 1;
        const lastSet = se.sets[se.sets.length - 1];
        db.prepare(
          `INSERT INTO exercise_sets (session_exercise_id, set_number, reps, weight_kg, rpe, completed)
           VALUES (?, ?, ?, ?, ?, 1)`
        ).run(se.id, nextSetNum, lastSet?.reps || 10, lastSet?.weight_kg || 0, lastSet?.rpe || null);
      }
      break;
    }

    case "skip_exercise": {
      // Mark all remaining sets as completed/skipped
      if (!context.hasActiveSession || !context.currentExercise) break;
      const se = context.currentExercise;
      const incomplete = se.sets.filter((s) => !s.completed);
      for (const set of incomplete) {
        db.prepare("UPDATE exercise_sets SET completed = 1, notes = 'skipped via voice' WHERE id = ?").run(set.id);
      }
      break;
    }

    case "complete_workout": {
      if (!context.hasActiveSession) break;
      db.prepare(
        `UPDATE workout_sessions SET ended_at = datetime('now'), mood_after = ? WHERE id = ?`
      ).run(params.mood_after || 7, context.sessionId);

      eventBus.emit("workout.completed", { userId, sessionId: context.sessionId });
      break;
    }

    case "add_exercise": {
      if (!context.hasActiveSession) break;
      const exercise = db
        .prepare("SELECT id FROM exercises WHERE LOWER(name) LIKE ? LIMIT 1")
        .get(`%${(params.exercise_name || "").toLowerCase()}%`);

      if (exercise) {
        const maxOrder = db
          .prepare("SELECT MAX(order_index) as max_idx FROM session_exercises WHERE session_id = ?")
          .get(context.sessionId);
        db.prepare(
          `INSERT INTO session_exercises (session_id, exercise_id, order_index)
           VALUES (?, ?, ?)`
        ).run(context.sessionId, exercise.id, (maxOrder?.max_idx || 0) + 1);
        parsed.response = `Added ${params.exercise_name} to your workout!`;
      } else {
        parsed.response = `Couldn't find "${params.exercise_name}" in the exercise library.`;
        parsed.mood = "concerned";
      }
      break;
    }

    // get_status, encouragement, general — no DB action needed
    default:
      break;
  }

  return parsed;
}

// ─── API Endpoints ─────────────────────────────────────────────

async function processCommand(req, res, next) {
  try {
    const { command } = req.body;
    if (!command || typeof command !== "string" || command.trim().length === 0) {
      throw new BadRequestError("Voice command text is required");
    }

    const db = getDb();
    const context = buildWorkoutContext(db, req.userId);

    let parsed;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        parsed = await processWithClaude(command.trim(), context);
      } catch (err) {
        console.error("[voice] Claude API error, falling back:", err.message);
        parsed = parseCommandFallback(command.trim(), context);
      }
    } else {
      parsed = parseCommandFallback(command.trim(), context);
    }

    // Execute the action
    const result = executeAction(db, req.userId, context, parsed);

    // Log the interaction
    db.prepare(
      `INSERT INTO voice_interactions (user_id, command, action, response, session_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(req.userId, command.trim(), result.action, result.response, context.sessionId || null);

    res.json({
      action: result.action,
      response: result.response,
      mood: result.mood || "idle",
      params: result.params,
      context: {
        hasActiveSession: context.hasActiveSession,
        sessionId: context.sessionId || null,
        currentExercise: context.currentExercise
          ? { name: context.currentExercise.name, setsCompleted: context.currentExercise.completedCount }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

function getWorkoutContext(req, res, next) {
  try {
    const db = getDb();
    const context = buildWorkoutContext(db, req.userId);
    res.json(context);
  } catch (err) {
    next(err);
  }
}

function getHistory(req, res, next) {
  try {
    const db = getDb();
    const history = db
      .prepare(
        `SELECT * FROM voice_interactions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .all(req.userId);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

// ─── Peqo mood endpoint — determines mascot mood from user state ──

function getMood(req, res, next) {
  try {
    const db = getDb();
    const userId = req.userId;
    const now = new Date();
    const hour = now.getHours();

    // Check for active workout
    const activeSession = getActiveSession(db, userId);
    if (activeSession) {
      return res.json({ mood: "motivated", message: "Let's crush this workout!" });
    }

    // Check for recent PR (last 24h)
    const recentPR = db
      .prepare(
        `SELECT * FROM personal_records WHERE user_id = ? AND achieved_at >= datetime('now', '-1 day')
         ORDER BY achieved_at DESC LIMIT 1`
      )
      .get(userId);
    if (recentPR) {
      return res.json({ mood: "celebrating", message: `You hit a PR on ${recentPR.exercise_name}!` });
    }

    // Check workout frequency (concerned if >3 days since last workout)
    const lastWorkout = db
      .prepare(
        `SELECT ended_at FROM workout_sessions WHERE user_id = ? AND ended_at IS NOT NULL
         ORDER BY ended_at DESC LIMIT 1`
      )
      .get(userId);
    if (lastWorkout) {
      const daysSince = (Date.now() - new Date(lastWorkout.ended_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 3) {
        return res.json({ mood: "concerned", message: `It's been ${Math.floor(daysSince)} days. Ready to get back at it?` });
      }
    }

    // Late night = sleeping
    if (hour >= 23 || hour < 6) {
      return res.json({ mood: "sleeping", message: "Rest up! Recovery is where gains happen." });
    }

    // Check if completed a workout today
    const todayStr = now.toISOString().split("T")[0];
    const todayWorkout = db
      .prepare(
        `SELECT id FROM workout_sessions
         WHERE user_id = ? AND ended_at IS NOT NULL AND date(ended_at) = ?`
      )
      .get(userId, todayStr);
    if (todayWorkout) {
      return res.json({ mood: "happy", message: "Great job today! Fuel up with good nutrition." });
    }

    // Default
    return res.json({ mood: "idle", message: "Hey! Ready to train?" });
  } catch (err) {
    next(err);
  }
}

module.exports = { processCommand, getWorkoutContext, getHistory, getMood };
