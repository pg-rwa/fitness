const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'staypicker.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      property_type TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      price_per_night REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      max_guests INTEGER DEFAULT 2,
      bedrooms INTEGER DEFAULT 1,
      bathrooms INTEGER DEFAULT 1,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      host_name TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS property_amenities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id TEXT NOT NULL REFERENCES properties(id),
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS property_accessibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id TEXT NOT NULL REFERENCES properties(id),
      feature TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS property_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id TEXT NOT NULL REFERENCES properties(id),
      rule_type TEXT NOT NULL,
      value TEXT NOT NULL,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS property_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id TEXT NOT NULL REFERENCES properties(id),
      highlight TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_sessions (
      id TEXT PRIMARY KEY,
      requirements_raw TEXT,
      requirements_parsed TEXT,
      results TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_amenities_property ON property_amenities(property_id);
    CREATE INDEX IF NOT EXISTS idx_amenities_category ON property_amenities(category);
    CREATE INDEX IF NOT EXISTS idx_amenities_name ON property_amenities(name);
    CREATE INDEX IF NOT EXISTS idx_accessibility_property ON property_accessibility(property_id);
    CREATE INDEX IF NOT EXISTS idx_rules_property ON property_rules(property_id);
    CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
    CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country);
    CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price_per_night);
    CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
  `);
}

runMigrations();

module.exports = db;
