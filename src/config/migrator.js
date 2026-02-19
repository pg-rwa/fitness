const fs = require("fs");
const path = require("path");
const { getDb } = require("./database");

class Migrator {
  constructor(migrationsDir) {
    this.migrationsDir = migrationsDir || path.join(__dirname, "../../migrations");
  }

  init() {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  getApplied() {
    const db = getDb();
    return db
      .prepare("SELECT name FROM _migrations ORDER BY id")
      .all()
      .map((r) => r.name);
  }

  getPending() {
    const applied = new Set(this.getApplied());
    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith(".js"))
      .sort();
    return files.filter((f) => !applied.has(f));
  }

  run() {
    this.init();
    const pending = this.getPending();
    if (pending.length === 0) return [];

    const db = getDb();
    const results = [];

    for (const file of pending) {
      const migration = require(path.join(this.migrationsDir, file));
      db.transaction(() => {
        migration.up(db);
        db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
      })();
      results.push(file);
    }

    return results;
  }

  rollback(count = 1) {
    const db = getDb();
    const applied = this.getApplied();
    const toRollback = applied.slice(-count);
    const results = [];

    for (const name of toRollback.reverse()) {
      const migration = require(path.join(this.migrationsDir, name));
      if (typeof migration.down === "function") {
        db.transaction(() => {
          migration.down(db);
          db.prepare("DELETE FROM _migrations WHERE name = ?").run(name);
        })();
        results.push(name);
      }
    }

    return results;
  }
}

module.exports = { Migrator };
