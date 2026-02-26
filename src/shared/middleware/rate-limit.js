const rateLimit = require("express-rate-limit");

const isTest = process.env.NODE_ENV === "test";
const passThrough = (_req, _res, next) => next();

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 min
const max = parseInt(process.env.RATE_LIMIT_MAX || "500", 10);

const apiLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later", code: "RATE_LIMIT_EXCEEDED" },
      keyGenerator: (req) => req.userId || req.ip,
    });

const authWindowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || "900000", 10); // 15 min
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "500", 10);

const authLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: authWindowMs,
      max: authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many login attempts, please try again later", code: "AUTH_RATE_LIMIT" },
    });

const uploadLimiter = isTest
  ? passThrough
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Upload limit reached, please try again later", code: "UPLOAD_RATE_LIMIT" },
    });

module.exports = { apiLimiter, authLimiter, uploadLimiter };
