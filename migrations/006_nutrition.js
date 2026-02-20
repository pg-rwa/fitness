/**
 * Phase 5: Nutrition - food database, meal presets, meal logging.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        serving_size REAL NOT NULL DEFAULT 100,
        serving_unit TEXT NOT NULL DEFAULT 'g',
        calories REAL NOT NULL DEFAULT 0,
        protein_g REAL DEFAULT 0,
        carbs_g REAL DEFAULT 0,
        fat_g REAL DEFAULT 0,
        fiber_g REAL DEFAULT 0,
        sugar_g REAL DEFAULT 0,
        sodium_mg REAL DEFAULT 0,
        barcode TEXT,
        photo_url TEXT,
        is_verified INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS meal_presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        meal_type TEXT DEFAULT 'any',
        photo_url TEXT,
        total_calories REAL DEFAULT 0,
        total_protein_g REAL DEFAULT 0,
        total_carbs_g REAL DEFAULT 0,
        total_fat_g REAL DEFAULT 0,
        is_public INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meal_preset_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preset_id INTEGER NOT NULL,
        food_item_id INTEGER NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT DEFAULT 'serving',
        FOREIGN KEY (preset_id) REFERENCES meal_presets(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meal_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        meal_type TEXT NOT NULL DEFAULT 'snack',
        logged_at TEXT DEFAULT (datetime('now')),
        photo_url TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meal_log_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_log_id INTEGER NOT NULL,
        food_item_id INTEGER NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT DEFAULT 'serving',
        calories REAL DEFAULT 0,
        protein_g REAL DEFAULT 0,
        carbs_g REAL DEFAULT 0,
        fat_g REAL DEFAULT 0,
        FOREIGN KEY (meal_log_id) REFERENCES meal_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
      CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode);
      CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, logged_at);
      CREATE INDEX IF NOT EXISTS idx_meal_presets_created_by ON meal_presets(created_by);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS meal_log_items;
      DROP TABLE IF EXISTS meal_logs;
      DROP TABLE IF EXISTS meal_preset_items;
      DROP TABLE IF EXISTS meal_presets;
      DROP TABLE IF EXISTS food_items;
    `);
  },
};
