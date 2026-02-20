/**
 * Phase 6: Health sync records and AI insights.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS health_sync_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        metric_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        synced_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ai_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        is_read INTEGER DEFAULT 0,
        generated_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_health_sync_user_metric ON health_sync_records(user_id, metric_type, recorded_at);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id, generated_at);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS ai_insights;
      DROP TABLE IF EXISTS health_sync_records;
    `);
  },
};
