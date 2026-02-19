const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../config/database");
const { jwtSecret, jwtExpiresIn, saltRounds } = require("../config/auth");

async function register({ email, password, firstName, lastName }) {
  const db = getDb();

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);
  const result = db
    .prepare("INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)")
    .run(email, passwordHash, firstName, lastName);

  const user = db
    .prepare("SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?")
    .get(result.lastInsertRowid);

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { user, token };
}

async function login({ email, password }) {
  const db = getDb();

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });
  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    token,
  };
}

module.exports = { register, login };
