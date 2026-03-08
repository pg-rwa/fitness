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
      ...require("../prisma/data/exercises-new-chest"),
      ...require("../prisma/data/exercises-new-back"),
      ...require("../prisma/data/exercises-new-shoulders"),
      ...require("../prisma/data/exercises-new-legs"),
      ...require("../prisma/data/exercises-new-arms"),
      ...require("../prisma/data/exercises-new-core"),
      ...require("../prisma/data/exercises-new-full-body"),
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

  // Auto-populate photo_url for exercises missing images
  // Uses free-exercise-db (public domain): https://github.com/yuhonas/free-exercise-db
  const missingPhotos = db.prepare("SELECT id, name FROM exercises WHERE photo_url IS NULL").all();
  if (missingPhotos.length > 0) {
    const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
    const update = db.prepare("UPDATE exercises SET photo_url = ? WHERE id = ?");
    // Known name mappings: our exercise name -> free-exercise-db image folder
    const KNOWN_MAPPINGS = {
      "Arnold Press": "Arnold_Dumbbell_Press",
      "Barbell Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
      "Barbell Row": "Bent_Over_Barbell_Row",
      "Barbell Squat": "Barbell_Full_Squat",
      "Barbell Back Squat": "Barbell_Squat",
      "Barbell Incline Bench Press": "Barbell_Incline_Bench_Press_-_Medium_Grip",
      "Battle Ropes": "Battling_Ropes",
      "Bench Tricep Dip": "Bench_Dips",
      "Bicycle Crunch": "Air_Bike",
      "Box Jump": "Bench_Jump",
      "Bulgarian Split Squat": "Barbell_Side_Split_Squat",
      "Burpees": "Burpee",
      "Cable Curl": "Cable_Hammer_Curls_-_Rope_Attachment",
      "Cable Flye": "Cable_Crossover",
      "Chin-Up": "Chin-Up",
      "Close-Grip Bench Press": "Close-Grip_Barbell_Bench_Press",
      "Close-Grip Lat Pulldown": "Close-Grip_Front_Lat_Pulldown",
      "Concentration Curl": "Concentration_Curls",
      "Crunch": "Crunches",
      "Deadlift": "Barbell_Deadlift",
      "Decline Bench Press": "Decline_Barbell_Bench_Press",
      "Decline Push Up": "Decline_Push-Up",
      "Diamond Push-Up": "Diamond_Push-Up",
      "Dip": "Dips_-_Chest_Version",
      "Dumbbell Bench Press": "Dumbbell_Bench_Press",
      "Dumbbell Bicep Curl": "Dumbbell_Bicep_Curl",
      "Dumbbell Flye": "Dumbbell_Flyes",
      "Dumbbell Lateral Raise": "Side_Lateral_Raise",
      "Dumbbell Pullover": "Bent-Arm_Dumbbell_Pullover",
      "Dumbbell Shoulder Press": "Dumbbell_Shoulder_Press",
      "Dumbbell Shrug": "Dumbbell_Shrug",
      "EZ Bar Curl": "EZ-Bar_Curl",
      "Face Pull": "Face_Pull",
      "Farmer's Walk": "Farmer%27s_Walk",
      "Front Raise": "Front_Dumbbell_Raise",
      "Front Squat": "Barbell_Full_Squat",
      "Glute Bridge": "Barbell_Glute_Bridge",
      "Goblet Squat": "Goblet_Squat",
      "Good Morning": "Good_Morning",
      "Hack Squat": "Barbell_Hack_Squat",
      "Hammer Curl": "Hammer_Curls",
      "Hanging Leg Raise": "Hanging_Leg_Raise",
      "Incline Dumbbell Curl": "Alternate_Incline_Dumbbell_Curl",
      "Incline Dumbbell Press": "Incline_Dumbbell_Press",
      "Inverted Row": "Inverted_Row",
      "Jumping Jacks": "Jumping_Jacks",
      "Lat Pulldown": "Wide-Grip_Lat_Pulldown",
      "Lateral Raise": "Side_Lateral_Raise",
      "Leg Curl": "Seated_Leg_Curl",
      "Leg Extension": "Leg_Extensions",
      "Leg Press": "Leg_Press",
      "Mountain Climber": "Mountain_Climbers",
      "Nordic Hamstring Curl": "Natural_Glute_Ham_Raise",
      "Overhead Press": "Standing_Military_Press",
      "Overhead Tricep Extension": "Standing_Dumbbell_Triceps_Extension",
      "Pec Deck Machine": "Butterfly",
      "Preacher Curl": "Preacher_Curl_-_With_Dumbbell",
      "Pull Up": "Pullups",
      "Pull-Up": "Pullups",
      "Push Up": "Pushups",
      "Push-Up": "Pushups",
      "Reverse Crunch": "Reverse_Crunch",
      "Romanian Deadlift": "Romanian_Deadlift_With_Dumbbells",
      "Seated Cable Row": "Seated_Cable_Rows",
      "Seated Calf Raise": "Barbell_Seated_Calf_Raise",
      "Side Plank": "Side_Bridge",
      "Skull Crusher": "Lying_Triceps_Press",
      "Squat Jump": "Freehand_Jump_Squat",
      "Standing Calf Raise": "Standing_Calf_Raises",
      "Sumo Deadlift": "Sumo_Deadlift",
      "Superman": "Superman",
      "T-Bar Row": "T-Bar_Row_with_Handle",
      "Tricep Dip": "Dips_-_Triceps_Version",
      "Tricep Kickback": "Tricep_Dumbbell_Kickback",
      "Tricep Pushdown": "Triceps_Pushdown",
      "Upright Row": "Upright_Barbell_Row",
      "Wide Grip Lat Pulldown": "Wide-Grip_Lat_Pulldown",
      "Wide Grip Pull Up": "Wide-Grip_Rear_Pull-Up",
      "Zottman Curl": "Zottman_Curl",
    };
    function nameToSlug(name) {
      return name.replace(/\//g, "_").replace(/[()]/g, "").replace(/\s+/g, "_");
    }
    db.transaction(() => {
      for (const ex of missingPhotos) {
        const folder = KNOWN_MAPPINGS[ex.name] || nameToSlug(ex.name);
        const url = `${BASE}/${folder}/0.jpg`;
        update.run(url, ex.id);
      }
    })();
    console.log(`  -> Set photo_url for ${missingPhotos.length} exercises.`);
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
