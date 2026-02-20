const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel =
  LOG_LEVELS[process.env.LOG_LEVEL] ??
  (process.env.NODE_ENV === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug);

function formatLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  // In production, output JSON for machine parsing
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  // In dev/test, output human-readable
  const metaStr = Object.keys(meta).length
    ? " " + JSON.stringify(meta)
    : "";
  return `[${entry.timestamp}] ${level.toUpperCase()} ${message}${metaStr}`;
}

const logger = {
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatLog("error", message, meta));
    }
  },

  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatLog("warn", message, meta));
    }
  },

  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(formatLog("info", message, meta));
    }
  },

  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(formatLog("debug", message, meta));
    }
  },

  /** Create a child logger with preset context fields */
  child(context) {
    const child = {};
    for (const level of Object.keys(LOG_LEVELS)) {
      child[level] = (message, meta = {}) =>
        logger[level](message, { ...context, ...meta });
    }
    child.child = (extra) => logger.child({ ...context, ...extra });
    return child;
  },
};

module.exports = { logger, LOG_LEVELS };
