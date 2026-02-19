const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/auth");
const { UnauthorizedError } = require("../utils/errors");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError());
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.userId = payload.userId;
    req.userRole = payload.role || "client";
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

module.exports = { authenticate };
