#!/usr/bin/env node
/**
 * SQLite → PostgreSQL Data Migration Script
 *
 * Copies all data from the SQLite database to a PostgreSQL database.
 *
 * Usage:
 *   DATABASE_URL=postgres://fitness:pass@localhost:5432/fitness node scripts/migrate-to-postgres.js
 *
 * Prerequisites:
 *   1. PostgreSQL running (e.g., via docker-compose up postgres)
 *   2. DATABASE_URL set to the PostgreSQL connection string
 *   3. SQLite database at data/fitness.db (or SQLITE_PATH env var)
 */
require("dotenv").config();
const Database = require("better-sqlite3");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, "../data/fitness.db");
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL || !PG_URL.startsWith("postgres")) {
  console.error("Error: DATABASE_URL must be a PostgreSQL connection string.");
  console.error("Example: DATABASE_URL=postgres://fitness:pass@localhost:5432/fitness");
  process.exit(1);
}

if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`Error: SQLite database not found at ${SQLITE_PATH}`);
  process.exit(1);
}

// Tables to migrate in order (respects foreign key dependencies)
const TABLES = [
  "users",
  "user_profiles",
  "exercises",
  "equipment",
  "workout_templates",
  "template_exercises",
  "workout_sessions",
  "session_exercises",
  "exercise_sets",
  "personal_records",
  "goals",
  "progress_measurements",
  "food_items",
  "meals",
  "meal_items",
  "meal_presets",
  "meal_preset_items",
  "nutrition_targets",
  "notifications",
  "ai_insights",
  "scheduled_sessions",
  "refresh_tokens",
  "invitations",
  "health_sync_profiles",
  "custom_field_definitions",
  "custom_field_values",
  "file_uploads",
  "otp_codes",
  "assigned_workouts",
  "workouts",
  "workout_exercises",
  "workout_exercise_sets",
];

async function migrate() {
  console.log("=== SQLite → PostgreSQL Migration ===\n");

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const pg = new Pool({ connectionString: PG_URL });

  // Get list of actual tables in SQLite
  const sqliteTables = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '__%' ORDER BY name"
  ).all().map(r => r.name);

  console.log(`SQLite tables found: ${sqliteTables.length}`);

  // Create PostgreSQL schema
  console.log("\nCreating PostgreSQL schema...");
  await createPgSchema(pg, sqlite);

  // Migrate each table
  const tablesToMigrate = TABLES.filter(t => sqliteTables.includes(t));
  // Also add any tables we missed
  for (const t of sqliteTables) {
    if (!tablesToMigrate.includes(t)) tablesToMigrate.push(t);
  }

  let totalRows = 0;
  for (const table of tablesToMigrate) {
    const count = await migrateTable(sqlite, pg, table);
    totalRows += count;
  }

  // Reset sequences
  console.log("\nResetting PostgreSQL sequences...");
  for (const table of tablesToMigrate) {
    try {
      await pg.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
    } catch {}
  }

  console.log(`\n=== Migration complete! ${totalRows} total rows migrated across ${tablesToMigrate.length} tables ===`);

  sqlite.close();
  await pg.end();
}

async function createPgSchema(pg, sqlite) {
  // Read all migration files and convert SQLite SQL to PostgreSQL
  const migrationsDir = path.join(__dirname, "../migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".js")).sort();

  // Create migrations tracking table
  await pg.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  for (const file of files) {
    // Check if already applied
    const existing = await pg.query("SELECT 1 FROM _migrations WHERE name = $1", [file]);
    if (existing.rows.length > 0) continue;

    console.log(`  Applying migration: ${file}`);
    const migration = require(path.join(migrationsDir, file));

    // Get the SQL from the migration by running it through a SQL collector
    const statements = [];
    const fakeDb = {
      exec(sql) { statements.push(sql); },
      prepare() {
        return {
          run() { return { changes: 0 }; },
          get() { return undefined; },
          all() { return []; },
        };
      },
      transaction(fn) { return (...args) => fn(...args); },
    };

    try {
      migration.up(fakeDb);
    } catch {}

    for (const sql of statements) {
      const pgSql = convertSqliteToPg(sql);
      const stmts = pgSql.split(";").map(s => s.trim()).filter(Boolean);
      for (const stmt of stmts) {
        try {
          await pg.query(stmt);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes("already exists")) {
            console.warn(`    Warning: ${err.message.slice(0, 100)}`);
          }
        }
      }
    }

    await pg.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
  }
}

function convertSqliteToPg(sql) {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY")
    .replace(/datetime\('now'\)/gi, "NOW()")
    .replace(/AUTOINCREMENT/gi, "")
    .replace(/INSERT OR IGNORE/gi, "INSERT ON CONFLICT DO NOTHING")
    // SQLite REAL → PostgreSQL DOUBLE PRECISION
    .replace(/\bREAL\b/g, "DOUBLE PRECISION")
    // SQLite INTEGER for booleans
    .replace(/\bINTEGER DEFAULT 0\b/g, "INTEGER DEFAULT 0")
    .replace(/\bINTEGER DEFAULT 1\b/g, "INTEGER DEFAULT 1");
}

async function migrateTable(sqlite, pg, table) {
  const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (empty)`);
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const insertSql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let migrated = 0;
  const client = await pg.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      const values = columns.map(c => row[c]);
      try {
        await client.query(insertSql, values);
        migrated++;
      } catch (err) {
        // Skip rows that conflict
        await client.query("ROLLBACK");
        await client.query("BEGIN");
      }
    }
    await client.query("COMMIT");
  } finally {
    client.release();
  }

  console.log(`  ${table}: ${migrated}/${rows.length} rows migrated`);
  return migrated;
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
