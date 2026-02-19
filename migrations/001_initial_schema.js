/**
 * Initial schema migration - captures the baseline database structure.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client',
        trainer_id INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        avatar_url TEXT,
        height_cm REAL,
        weight_kg REAL,
        date_of_birth TEXT,
        gender TEXT,
        fitness_level TEXT DEFAULT 'beginner',
        bio TEXT,
        phone TEXT,
        timezone TEXT DEFAULT 'UTC',
        preferences TEXT DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        secondary_muscles TEXT DEFAULT '[]',
        equipment_id INTEGER,
        equipment TEXT,
        instructions TEXT,
        video_url TEXT,
        photo_url TEXT,
        is_custom INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        started_at TEXT DEFAULT (datetime('now')),
        ended_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_exercise_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        reps INTEGER,
        weight_kg REAL,
        duration_sec INTEGER,
        distance_m REAL,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_date TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS custom_field_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        name TEXT NOT NULL,
        field_type TEXT NOT NULL DEFAULT 'text',
        options TEXT DEFAULT '{}',
        is_active INTEGER DEFAULT 1,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(entity_type, name)
      );

      CREATE TABLE IF NOT EXISTS custom_field_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        field_def_id INTEGER NOT NULL,
        value TEXT,
        recorded_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (field_def_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS file_uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        original_name TEXT,
        mime_type TEXT,
        size_bytes INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS file_uploads;
      DROP TABLE IF EXISTS custom_field_values;
      DROP TABLE IF EXISTS custom_field_definitions;
      DROP TABLE IF EXISTS goals;
      DROP TABLE IF EXISTS workout_exercise_sets;
      DROP TABLE IF EXISTS workout_exercises;
      DROP TABLE IF EXISTS workouts;
      DROP TABLE IF EXISTS exercises;
      DROP TABLE IF EXISTS user_profiles;
      DROP TABLE IF EXISTS users;
    `);
  },
};
