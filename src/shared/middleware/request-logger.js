const crypto = require("crypto");
const { logger } = require("../services/logger");
const { metrics } = require("../services/metrics");

/**
 * Request logging middleware.
 * - Assigns a correlation ID (X-Request-Id) to every request
 * - Logs method, path, status, and duration
 * - Feeds the metrics collector
 */
function requestLogger(req, res, next) {
  // Correlation ID — use incoming header or generate one
  const requestId =
    req.headers["x-request-id"] || crypto.randomUUID().slice(0, 8);
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = process.hrtime.bigint();
  metrics.trackActive(1);

  // Capture when response finishes
  res.on("finish", () => {
    metrics.trackActive(-1);

    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(durationNs / 1e6);

    metrics.recordRequest(req.method, req.originalUrl, res.statusCode, durationMs);

    const meta = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.headers["x-real-ip"],
      userAgent: req.headers["user-agent"],
    };

    // Add user id when authenticated
    if (req.user?.id) {
      meta.userId = req.user.id;
    }

    if (res.statusCode >= 500) {
      logger.error("Request failed", meta);
    } else if (res.statusCode >= 400) {
      logger.warn("Client error", meta);
    } else {
      logger.info("Request completed", meta);
    }
  });

  next();
}

module.exports = { requestLogger };
