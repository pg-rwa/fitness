/**
 * Phase 2: Equipment, workout templates, workout sessions, assignments.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        category TEXT NOT NULL DEFAULT 'other',
        photo_url TEXT,
        default_settings TEXT DEFAULT '{}',
        gym_location TEXT,
        notes TEXT,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS workout_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        difficulty TEXT DEFAULT 'intermediate',
        estimated_duration_min INTEGER,
        photo_url TEXT,
        is_public INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS template_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0,
        target_sets INTEGER DEFAULT 3,
        target_reps INTEGER DEFAULT 10,
        target_weight_kg REAL,
        rest_seconds INTEGER DEFAULT 60,
        notes TEXT,
        superset_group INTEGER,
        machine_settings TEXT DEFAULT '{}',
        FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        template_id INTEGER,
        assigned_by INTEGER,
        name TEXT NOT NULL,
        notes TEXT,
        mood_before INTEGER,
        mood_after INTEGER,
        started_at TEXT DEFAULT (datetime('now')),
        ended_at TEXT,
        scheduled_at TEXT,
        total_volume REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS session_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0,
        notes TEXT,
        machine_settings TEXT DEFAULT '{}',
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS exercise_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        set_type TEXT DEFAULT 'working',
        reps INTEGER,
        weight_kg REAL,
        duration_sec INTEGER,
        distance_m REAL,
        rpe INTEGER,
        completed INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (session_exercise_id) REFERENCES session_exercises(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS personal_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        record_type TEXT NOT NULL,
        value REAL NOT NULL,
        previous_value REAL,
        session_id INTEGER,
        achieved_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS assigned_workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        day_of_week INTEGER,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
      CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by ON workout_templates(created_by);
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_template ON workout_sessions(template_id);
      CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);
      CREATE INDEX IF NOT EXISTS idx_exercise_sets_session_exercise ON exercise_sets(session_exercise_id);
      CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
      CREATE INDEX IF NOT EXISTS idx_assigned_workouts_client ON assigned_workouts(client_id);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS assigned_workouts;
      DROP TABLE IF EXISTS personal_records;
      DROP TABLE IF EXISTS exercise_sets;
      DROP TABLE IF EXISTS session_exercises;
      DROP TABLE IF EXISTS workout_sessions;
      DROP TABLE IF EXISTS template_exercises;
      DROP TABLE IF EXISTS workout_templates;
      DROP TABLE IF EXISTS equipment;
    `);
  },
};
