/**
 * Phase 4: Scheduling, trainer availability, and notifications.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS trainer_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(trainer_id, day_of_week, start_time)
      );

      CREATE TABLE IF NOT EXISTS scheduled_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        template_id INTEGER,
        title TEXT NOT NULL,
        scheduled_start TEXT NOT NULL,
        scheduled_end TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'requested',
        requested_by TEXT NOT NULL DEFAULT 'client',
        recurrence_rule TEXT,
        location TEXT,
        notes TEXT,
        decline_reason TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        data TEXT DEFAULT '{}',
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_trainer_availability ON trainer_availability(trainer_id);
      CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_trainer ON scheduled_sessions(trainer_id, scheduled_start);
      CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_client ON scheduled_sessions(client_id, scheduled_start);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS scheduled_sessions;
      DROP TABLE IF EXISTS trainer_availability;
    `);
  },
};
