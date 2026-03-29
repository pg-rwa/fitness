/**
 * Social features (challenges, leaderboards), analytics exports, and push notification device tokens.
 */
module.exports = {
  up(db) {
    db.exec(`
      -- Challenges
      CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'workout_count',
        target_value REAL NOT NULL DEFAULT 1,
        unit TEXT DEFAULT 'workouts',
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        is_public INTEGER DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Challenge participants
      CREATE TABLE IF NOT EXISTS challenge_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        current_value REAL DEFAULT 0,
        joined_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(challenge_id, user_id)
      );

      -- Device tokens for push notifications
      CREATE TABLE IF NOT EXISTS device_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'expo',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(token)
      );

      CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status, end_date);
      CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS device_tokens;
      DROP TABLE IF EXISTS challenge_participants;
      DROP TABLE IF EXISTS challenges;
    `);
  },
};
