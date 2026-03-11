#!/usr/bin/env node
/**
 * Flush all user-generated data from the database.
 * Preserves: exercises, food_items, equipment, migrations (seed data).
 * Usage: node scripts/flush-user-data.js
 */

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "..", "data", "fitness.db");

const TABLES_TO_FLUSH = [
  // Auth & users
  "otp_codes",
  "refresh_tokens",
  "invitations",
  "trainer_requests",
  // User data
  "user_profiles",
  "custom_field_values",
  "custom_field_definitions",
  "file_uploads",
  // Workouts
  "exercise_sets",
  "session_exercises",
  "workout_sessions",
  "template_exercises",
  "workout_templates",
  "assigned_workouts",
  // Progress
  "personal_records",
  "progress_measurements",
  "goals",
  // Nutrition
  "meal_items",
  "meals",
  "meal_presets",
  "nutrition_targets",
  // Scheduling & notifications
  "scheduled_sessions",
  "notifications",
  // AI & health
  "ai_insights",
  "health_sync_profiles",
  // Calendar
  "calendar_events",
  // Users last (FK dependencies)
  "users",
];

try {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF");

  const existingTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);

  let flushed = 0;
  for (const table of TABLES_TO_FLUSH) {
    if (existingTables.includes(table)) {
      const info = db.prepare(`DELETE FROM ${table}`).run();
      if (info.changes > 0) {
        console.log(`  Deleted ${info.changes} rows from ${table}`);
      }
      flushed++;
    }
  }

  db.pragma("foreign_keys = ON");
  db.close();

  console.log(`\nFlushed ${flushed} tables. Seed data (exercises, foods) preserved.`);
  console.log("Done. Users can now register with genuine emails.");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
