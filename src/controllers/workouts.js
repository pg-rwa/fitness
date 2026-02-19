const { getDb } = require("../config/database");

function list(req, res, next) {
  try {
    const db = getDb();
    const workouts = db
      .prepare("SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC")
      .all(req.userId);

    for (const workout of workouts) {
      workout.exercises = getWorkoutExercises(db, workout.id);
    }

    res.json(workouts);
  } catch (err) {
    next(err);
  }
}

function getById(req, res, next) {
  try {
    const db = getDb();
    const workout = db
      .prepare("SELECT * FROM workouts WHERE id = ? AND user_id = ?")
      .get(parseInt(req.params.id, 10), req.userId);

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    workout.exercises = getWorkoutExercises(db, workout.id);
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const db = getDb();
    const result = db
      .prepare("INSERT INTO workouts (user_id, name, notes) VALUES (?, ?, ?)")
      .run(req.userId, req.body.name, req.body.notes || null);

    const workout = db.prepare("SELECT * FROM workouts WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
}

function addExercise(req, res, next) {
  try {
    const db = getDb();
    const workoutId = parseInt(req.params.id, 10);

    const workout = db
      .prepare("SELECT * FROM workouts WHERE id = ? AND user_id = ?")
      .get(workoutId, req.userId);
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    const last = db
      .prepare("SELECT MAX(sort_order) as max_order FROM workout_exercises WHERE workout_id = ?")
      .get(workoutId);
    const sortOrder = (last?.max_order ?? -1) + 1;

    const weResult = db
      .prepare(
        "INSERT INTO workout_exercises (workout_id, exercise_id, sort_order) VALUES (?, ?, ?)"
      )
      .run(workoutId, req.body.exerciseId, sortOrder);

    const weId = weResult.lastInsertRowid;

    const insertSet = db.prepare(
      "INSERT INTO workout_exercise_sets (workout_exercise_id, set_number, reps, weight_kg, duration_sec, distance_m) VALUES (?, ?, ?, ?, ?, ?)"
    );

    for (let i = 0; i < req.body.sets.length; i++) {
      const s = req.body.sets[i];
      insertSet.run(weId, i + 1, s.reps || null, s.weightKg || null, s.durationSec || null, s.distanceM || null);
    }

    const workoutExercise = db
      .prepare("SELECT * FROM workout_exercises WHERE id = ?")
      .get(weId);
    const exercise = db
      .prepare("SELECT * FROM exercises WHERE id = ?")
      .get(req.body.exerciseId);
    const sets = db
      .prepare("SELECT * FROM workout_exercise_sets WHERE workout_exercise_id = ? ORDER BY set_number")
      .all(weId);

    res.status(201).json({ ...workoutExercise, exercise, sets });
  } catch (err) {
    next(err);
  }
}

function complete(req, res, next) {
  try {
    const db = getDb();
    const workoutId = parseInt(req.params.id, 10);

    const workout = db
      .prepare("SELECT * FROM workouts WHERE id = ? AND user_id = ?")
      .get(workoutId, req.userId);
    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    db.prepare("UPDATE workouts SET ended_at = datetime('now') WHERE id = ?").run(workoutId);
    const updated = db.prepare("SELECT * FROM workouts WHERE id = ?").get(workoutId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function getWorkoutExercises(db, workoutId) {
  const wes = db
    .prepare("SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY sort_order")
    .all(workoutId);

  for (const we of wes) {
    we.exercise = db.prepare("SELECT * FROM exercises WHERE id = ?").get(we.exercise_id);
    we.sets = db
      .prepare(
        "SELECT * FROM workout_exercise_sets WHERE workout_exercise_id = ? ORDER BY set_number"
      )
      .all(we.id);
  }
  return wes;
}

module.exports = { list, getById, create, addExercise, complete };
