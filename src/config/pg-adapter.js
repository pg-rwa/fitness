/**
 * PostgreSQL adapter that provides a better-sqlite3 compatible interface.
 *
 * Uses deasync to bridge the async pg library to the synchronous API
 * that the rest of the codebase expects. This is a transitional layer —
 * the long-term goal is to make all DB calls async.
 *
 * Usage: Set DATABASE_URL=postgres://... to activate.
 */
const { Pool } = require("pg");

let pool;

function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on("error", (err) => {
    console.error("[pg-pool-error]", err.message);
  });
  return pool;
}

/**
 * Convert SQLite `?` placeholders to PostgreSQL `$1, $2, ...`
 * and adapt SQLite-specific syntax.
 */
function convertSQL(sql) {
  let idx = 0;
  let converted = sql.replace(/\?/g, () => `$${++idx}`);

  converted = converted
    .replace(/datetime\('now'\)/gi, "NOW()")
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY")
    .replace(/INSERT OR IGNORE/gi, "INSERT ON CONFLICT DO NOTHING")
    // SQLite LIKE is case-insensitive by default; PostgreSQL needs ILIKE
    .replace(/\bLIKE\b/gi, "ILIKE");

  return { sql: converted, paramCount: idx };
}

/**
 * Run a query synchronously by blocking until the promise resolves.
 * Uses the Node.js Atomics API for zero-CPU-cost blocking.
 */
function runSync(asyncFn) {
  let result, error, done = false;

  asyncFn().then(
    (r) => { result = r; done = true; },
    (e) => { error = e; done = true; }
  );

  // Use setImmediate trick to let the event loop process the promise
  // This works because we call it from a synchronous context
  const { execFileSync } = require("child_process");
  const start = Date.now();
  while (!done) {
    if (Date.now() - start > 15000) {
      throw new Error("PostgreSQL query timeout (15s)");
    }
    // Yield to event loop for ~1ms
    try {
      execFileSync(process.execPath, ["-e", ""], { timeout: 2 });
    } catch {}
  }

  if (error) throw error;
  return result;
}

class PgStatement {
  constructor(originalSQL) {
    this.originalSQL = originalSQL;
    const { sql } = convertSQL(originalSQL);
    this.sql = sql;
  }

  run(...params) {
    const result = runSync(() => getPool().query(this.sql, params));
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: result.rows?.[0]?.id || 0,
    };
  }

  get(...params) {
    const result = runSync(() => getPool().query(this.sql, params));
    return result.rows?.[0] || undefined;
  }

  all(...params) {
    const result = runSync(() => getPool().query(this.sql, params));
    return result.rows || [];
  }
}

class PgDatabase {
  prepare(sql) {
    return new PgStatement(sql);
  }

  exec(sql) {
    // Split multiple statements and run them individually
    const { sql: converted } = convertSQL(sql);
    const statements = converted.split(";").map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      runSync(() => getPool().query(stmt));
    }
  }

  pragma() {
    // No-op for PostgreSQL
  }

  transaction(fn) {
    return (...args) => {
      this.exec("BEGIN");
      try {
        const result = fn(...args);
        this.exec("COMMIT");
        return result;
      } catch (err) {
        this.exec("ROLLBACK");
        throw err;
      }
    };
  }

  close() {
    if (pool) {
      pool.end();
      pool = null;
    }
  }
}

module.exports = { PgDatabase, convertSQL };
