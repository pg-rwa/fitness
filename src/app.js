require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { initDb } = require("./config/database");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const exerciseRoutes = require("./routes/exercises");
const workoutRoutes = require("./routes/workouts");
const goalRoutes = require("./routes/goals");

initDb();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/goals", goalRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

module.exports = app;
