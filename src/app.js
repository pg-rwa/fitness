require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { initDb } = require("./config/database");
const { FeatureFlags } = require("./config/features");
const { ModuleRegistry } = require("./shared/services/module-registry");
const { eventBus } = require("./shared/services/event-bus");
const { errorHandler } = require("./shared/middleware/error-handler");
const { apiLimiter } = require("./shared/middleware/rate-limit");
const { requestLogger } = require("./shared/middleware/request-logger");
const { metrics } = require("./shared/services/metrics");

initDb();

// Auto-seed reference data (exercises, foods) if tables are empty
(function autoSeed() {
  const db = require("./config/database").getDb();
  const exerciseCount = db.prepare("SELECT COUNT(*) as c FROM exercises").get().c;
  if (exerciseCount === 0) {
    console.log("Auto-seeding exercises...");
    const allExercises = [
      ...require("../prisma/data/exercises-chest"),
      ...require("../prisma/data/exercises-back"),
      ...require("../prisma/data/exercises-shoulders"),
      ...require("../prisma/data/exercises-legs"),
      ...require("../prisma/data/exercises-arms"),
      ...require("../prisma/data/exercises-core-cardio"),
    ];
    const ins = db.prepare(
      `INSERT OR REPLACE INTO exercises (name, description, category, muscle_group, secondary_muscles, equipment, instructions, video_url, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    db.transaction(() => {
      for (const ex of allExercises) {
        ins.run(ex.name, ex.description, ex.category, ex.muscle_group, ex.secondary_muscles || "[]", ex.equipment, ex.instructions, ex.video_url || null, ex.photo_url || null);
      }
    })();
    console.log(`  -> Auto-seeded ${allExercises.length} exercises.`);
  }

  const foodCount = db.prepare("SELECT COUNT(*) as c FROM food_items").get().c;
  if (foodCount === 0) {
    console.log("Auto-seeding food items...");
    const foods = require("../prisma/data/food-items");
    const ins = db.prepare(
      `INSERT OR IGNORE INTO food_items (name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    db.transaction(() => {
      for (const f of foods) {
        ins.run(f.name, f.brand, f.serving_size, f.serving_unit, f.calories, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g, f.sugar_g, f.sodium_mg, f.is_verified);
      }
    })();
    console.log(`  -> Auto-seeded ${foods.length} food items.`);
  }
})();

const features = new FeatureFlags();
const registry = new ModuleRegistry();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Request logging & metrics (before routes)
app.use(requestLogger);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting on all API routes
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  const { wsManager } = require("./shared/services/websocket");
  res.json({
    status: "ok",
    version: require("../package.json").version,
    uptime: Math.floor(process.uptime()),
    modules: registry.list(),
    wsClients: wsManager.getOnlineCount(),
    memory: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

registry.loadAll(path.join(__dirname, "modules"), app, { features, eventBus });

// ─── Admin metrics endpoint ──────────────────────────────────────
const { authenticate } = require("./shared/middleware/authenticate");
const { authorize } = require("./shared/middleware/authorize");

app.get("/api/admin/metrics", authenticate, authorize("admin"), (_req, res) => {
  const { wsManager } = require("./shared/services/websocket");
  const snapshot = metrics.snapshot();
  snapshot.websocket = {
    online: wsManager.getOnlineCount(),
  };
  res.json(snapshot);
});

app.use(errorHandler);

module.exports = app;
