module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS voice_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        command TEXT NOT NULL,
        action TEXT NOT NULL,
        response TEXT,
        session_id INTEGER REFERENCES workout_sessions(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_voice_interactions_user ON voice_interactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_voice_interactions_session ON voice_interactions(session_id);
    `);
  },

  down(db) {
    db.exec("DROP TABLE IF EXISTS voice_interactions");
  },
};
