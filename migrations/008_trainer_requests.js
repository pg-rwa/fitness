/**
 * Trainer-client request system.
 * Allows trainers to search and request existing clients to join their roster.
 */
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS trainer_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        responded_at TEXT,
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(trainer_id, client_id)
      );

      CREATE INDEX IF NOT EXISTS idx_trainer_requests_trainer ON trainer_requests(trainer_id, status);
      CREATE INDEX IF NOT EXISTS idx_trainer_requests_client ON trainer_requests(client_id, status);
    `);
  },

  down(db) {
    db.exec(`
      DROP TABLE IF EXISTS trainer_requests;
    `);
  },
};
