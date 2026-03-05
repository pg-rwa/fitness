/**
 * Add tracking_type and thumbnail_url columns to exercises table.
 * tracking_type tells the UI which inputs to show per exercise.
 */
module.exports = {
  up(db) {
    db.exec(`
      ALTER TABLE exercises ADD COLUMN tracking_type TEXT NOT NULL DEFAULT 'reps_weight';
      ALTER TABLE exercises ADD COLUMN thumbnail_url TEXT;
    `);

    // Set tracking types for existing exercises
    const updates = [
      // duration exercises
      { type: 'duration', names: ['Plank', 'Yoga Flow', 'Dynamic Stretching Routine', 'Foam Rolling Recovery', 'Hip Mobility Flow', 'Dead Bug'] },
      // duration_distance exercises
      { type: 'duration_distance', names: ['Running', 'Cycling', 'Rowing Machine', 'Stair Climber'] },
      // reps_only (bodyweight, no external load)
      { type: 'reps_only', names: ['Push-Up', 'Pull-Up', 'Chin-Up', 'Dips (Chest Focus)', 'Tricep Dip', 'Hanging Leg Raise', 'Crunch', 'Russian Twist', 'Mountain Climber', 'Burpees', 'Box Jump'] },
      // reps_duration (can be done for reps or time)
      { type: 'reps_duration', names: ['Battle Ropes', 'Jump Rope', 'Kettlebell Swing'] },
    ];

    const stmt = db.prepare('UPDATE exercises SET tracking_type = ? WHERE name = ?');
    for (const { type, names } of updates) {
      for (const name of names) {
        stmt.run(type, name);
      }
    }
    // Everything else stays as default 'reps_weight'
  },

  down(db) {
    // SQLite doesn't support DROP COLUMN before 3.35.0, so recreate
    db.exec(`
      CREATE TABLE exercises_backup AS SELECT
        id, name, description, category, muscle_group, secondary_muscles,
        equipment_id, equipment, instructions, video_url, photo_url,
        is_custom, created_by, created_at
      FROM exercises;
      DROP TABLE exercises;
      ALTER TABLE exercises_backup RENAME TO exercises;
    `);
  },
};
