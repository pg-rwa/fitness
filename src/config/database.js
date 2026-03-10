const path = require("path");

const isPostgres =
  process.env.DB_TYPE === "postgres" ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

let db;

function getDb() {
  if (db) return db;

  if (isPostgres) {
    const { PgDatabase } = require("./pg-adapter");
    db = new PgDatabase();
  } else {
    const Database = require("better-sqlite3");
    const dbPath =
      process.env.DATABASE_URL || path.join(__dirname, "../../data/fitness.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

function initDb() {
  const database = getDb();

  if (isPostgres) {
    // PostgreSQL uses the same migrator — SQL differences are handled by pg-adapter
    const { Migrator } = require("./migrator");
    const migrator = new Migrator();
    const applied = migrator.run();
    if (applied.length > 0 && process.env.NODE_ENV !== "test") {
      console.log(`[pg] Applied ${applied.length} migration(s):`, applied);
    }
  } else {
    const { Migrator } = require("./migrator");
    const migrator = new Migrator();
    const applied = migrator.run();
    if (applied.length > 0 && process.env.NODE_ENV !== "test") {
      console.log(`Applied ${applied.length} migration(s):`, applied);
    }
  }

  return database;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initDb, closeDb, isPostgres };
