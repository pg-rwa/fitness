const { AppError } = require("../utils/errors");

function errorHandler(err, _req, res, _next) {
  if (process.env.NODE_ENV !== "test") {
    console.error(err.stack);
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
