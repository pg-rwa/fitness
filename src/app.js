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
      `INSERT OR REPLACE INTO exercises (name, description, category, muscle_group, secondary_muscles, equipment, instructions, video_url, photo_url, tracking_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    db.transaction(() => {
      for (const ex of allExercises) {
        ins.run(ex.name, ex.description, ex.category, ex.muscle_group, ex.secondary_muscles || "[]", ex.equipment, ex.instructions, ex.video_url || null, ex.photo_url || null, ex.tracking_type || "reps_weight");
      }
    })();
    console.log(`  -> Auto-seeded ${allExercises.length} exercises.`);
  }

  // Auto-generate SVG thumbnails for exercises that don't have them
  const missingThumbs = db.prepare("SELECT COUNT(*) as c FROM exercises WHERE thumbnail_url IS NULL AND is_custom = 0").get().c;
  if (missingThumbs > 0) {
    console.log(`Auto-generating ${missingThumbs} exercise thumbnails...`);
    const fs = require("fs");
    const thumbDir = path.join(__dirname, "../uploads/exercises");
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    const BODY_BASE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320" width="200" height="320">
  <defs><style>.body{fill:#e8e8e8;stroke:#999;stroke-width:1.5}.highlight{fill:#ef4444;opacity:0.7}.secondary{fill:#f97316;opacity:0.4}.label{font-family:-apple-system,sans-serif;font-size:11px;fill:#374151;text-anchor:middle;font-weight:600}</style></defs>
  <ellipse class="body" cx="100" cy="30" rx="20" ry="24"/><rect class="body" x="92" y="52" width="16" height="12"/>
  <path class="body" d="M65,64 L135,64 L130,180 L70,180 Z"/>
  <path class="body" d="M65,64 L45,70 L32,130 L28,180 L40,182 L48,135 L55,80"/>
  <path class="body" d="M135,64 L155,70 L168,130 L172,180 L160,182 L152,135 L145,80"/>
  <path class="body" d="M70,180 L65,250 L60,310 L80,312 L82,255 L85,180"/>
  <path class="body" d="M130,180 L135,250 L140,310 L120,312 L118,255 L115,180"/>
  HIGHLIGHTS
  <text class="label" x="100" y="315">LABEL_TEXT</text></svg>`;

    const MUSCLE_HIGHLIGHTS = {
      chest: { primary: `<ellipse class="highlight" cx="88" cy="90" rx="18" ry="16"/><ellipse class="highlight" cx="112" cy="90" rx="18" ry="16"/>`, label: "CHEST" },
      back: { primary: `<rect class="highlight" x="75" y="75" width="50" height="55" rx="8"/>`, label: "BACK" },
      shoulders: { primary: `<ellipse class="highlight" cx="60" cy="68" rx="14" ry="10"/><ellipse class="highlight" cx="140" cy="68" rx="14" ry="10"/>`, label: "SHOULDERS" },
      legs: { primary: `<path class="highlight" d="M70,180 L65,250 L82,255 L85,180 Z"/><path class="highlight" d="M130,180 L135,250 L118,255 L115,180 Z"/>`, label: "LEGS" },
      arms: { primary: `<path class="highlight" d="M45,70 L32,130 L48,135 L55,80 Z"/><path class="highlight" d="M155,70 L168,130 L152,135 L145,80 Z"/>`, label: "ARMS" },
      core: { primary: `<rect class="highlight" x="78" y="120" width="44" height="55" rx="6"/>`, label: "CORE" },
      "full body": { primary: `<path class="highlight" d="M65,64 L135,64 L130,180 L70,180 Z"/><path class="secondary" d="M70,180 L65,250 L82,255 L85,180 Z"/><path class="secondary" d="M130,180 L135,250 L118,255 L115,180 Z"/>`, label: "FULL BODY" },
      cardio: { primary: `<path class="highlight" d="M65,64 L135,64 L130,180 L70,180 Z"/><path class="secondary" d="M70,180 L65,250 L82,255 L85,180 Z"/><path class="secondary" d="M130,180 L135,250 L118,255 L115,180 Z"/>`, label: "CARDIO" },
    };

    const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const exercises = db.prepare("SELECT id, name, muscle_group FROM exercises WHERE thumbnail_url IS NULL AND is_custom = 0").all();
    const updateStmt = db.prepare("UPDATE exercises SET thumbnail_url = ? WHERE id = ?");
    db.transaction(() => {
      for (const ex of exercises) {
        const slug = slugify(ex.name);
        const filename = `${slug}.svg`;
        const highlights = MUSCLE_HIGHLIGHTS[ex.muscle_group] || MUSCLE_HIGHLIGHTS["full body"];
        const svg = BODY_BASE.replace("HIGHLIGHTS", highlights.primary).replace("LABEL_TEXT", highlights.label);
        fs.writeFileSync(path.join(thumbDir, filename), svg);
        updateStmt.run(`/uploads/exercises/${filename}`, ex.id);
      }
    })();
    console.log(`  -> Generated ${exercises.length} SVG thumbnails.`);
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

// Trust proxy (nginx in Docker) so rate limiter uses real client IP
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Request logging & metrics (before routes)
app.use(requestLogger);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting on API routes (skip auth — it has its own limiter)
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth/")) return next();
  return apiLimiter(req, res, next);
});

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
