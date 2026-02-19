/**
 * Phase 3: Body measurements, progress photos, calendar events.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS body_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recorded_at TEXT DEFAULT (datetime('now')),
        weight_kg REAL,
        body_fat_pct REAL,
        chest_cm REAL,
        waist_cm REAL,
        hips_cm REAL,
        bicep_left_cm REAL,
        bicep_right_cm REAL,
        thigh_left_cm REAL,
        thigh_right_cm REAL,
        neck_cm REAL,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS progress_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category TEXT DEFAULT 'front',
        notes TEXT,
        taken_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id, recorded_at);
      CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON progress_photos(user_id, taken_at);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS progress_photos;
      DROP TABLE IF EXISTS body_measurements;
    `);
  },
};
