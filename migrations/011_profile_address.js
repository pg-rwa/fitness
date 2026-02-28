/**
 * Add address field to user_profiles for contact information.
 */
module.exports = {
  up(db) {
    // Check if column already exists (safe for re-runs)
    const cols = db.prepare("PRAGMA table_info(user_profiles)").all();
    if (!cols.find((c) => c.name === "address")) {
      db.exec("ALTER TABLE user_profiles ADD COLUMN address TEXT");
    }
  },

  down(db) {
    // SQLite doesn't support DROP COLUMN before 3.35
    // No-op; column is nullable so harmless if left
  },
};
