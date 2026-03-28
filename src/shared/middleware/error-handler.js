const multer = require("multer");
const { AppError } = require("../utils/errors");
const { logger } = require("../services/logger");
const { metrics } = require("../services/metrics");

function errorHandler(err, req, res, _next) {
  metrics.recordError(err, req);

  if (process.env.NODE_ENV !== "test") {
    logger.error(err.message, {
      requestId: req.requestId,
      stack: err.stack,
      code: err.code,
      status: err.status,
    });
  }

  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? "File too large. Maximum size is 10MB."
      : `Upload error: ${err.message}`;
    return res.status(400).json({ error: msg, code: "UPLOAD_ERROR" });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

module.exports = { errorHandler };
