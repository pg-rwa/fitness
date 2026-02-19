const Database = require("better-sqlite3");
const path = require("path");

const dbPath =
  process.env.DATABASE_URL || path.join(__dirname, "../../data/fitness.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function initDb() {
  const db = getDb();
  const { Migrator } = require("./migrator");
  const migrator = new Migrator();
  const applied = migrator.run();
  if (applied.length > 0 && process.env.NODE_ENV !== "test") {
    console.log(`Applied ${applied.length} migration(s):`, applied);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initDb, closeDb };
