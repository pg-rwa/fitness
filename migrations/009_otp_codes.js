/**
 * OTP verification codes for email-based authentication.
 * Used for registration verification and invitation acceptance.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'registration',
        expires_at TEXT NOT NULL,
        verified_at TEXT,
        attempts INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_otp_codes_email_type ON otp_codes(email, type);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS otp_codes;
    `);
  },
};
