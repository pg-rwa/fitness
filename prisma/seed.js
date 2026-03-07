const { initDb, getDb, closeDb } = require("../src/config/database");

// Exercise data files
const chestExercises = require("./data/exercises-chest");
const backExercises = require("./data/exercises-back");
const shoulderExercises = require("./data/exercises-shoulders");
const legExercises = require("./data/exercises-legs");
const armExercises = require("./data/exercises-arms");
const coreCardioExercises = require("./data/exercises-core-cardio");
// New exercises (expanded library from reference images)
const newChest = require("./data/exercises-new-chest");
const newBack = require("./data/exercises-new-back");
const newShoulders = require("./data/exercises-new-shoulders");
const newLegs = require("./data/exercises-new-legs");
const newArms = require("./data/exercises-new-arms");
const newCore = require("./data/exercises-new-core");
const newFullBody = require("./data/exercises-new-full-body");

// Workout templates
const workoutTemplates = require("./data/workout-templates");

// Food items
const foods = require("./data/food-items");

// Combine all exercises
const exercises = [
  ...chestExercises,
  ...backExercises,
  ...shoulderExercises,
  ...legExercises,
  ...armExercises,
  ...coreCardioExercises,
  ...newChest,
  ...newBack,
  ...newShoulders,
  ...newLegs,
  ...newArms,
  ...newCore,
  ...newFullBody,
];

function main() {
  initDb();
  const db = getDb();

  // ─── SEED EXERCISES ───
  console.log("Seeding exercises...");
  const insertExercise = db.prepare(
    `INSERT OR REPLACE INTO exercises (name, description, category, muscle_group, secondary_muscles, equipment, instructions, video_url, photo_url, tracking_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  db.transaction(() => {
    for (const ex of exercises) {
      insertExercise.run(
        ex.name, ex.description, ex.category, ex.muscle_group,
        ex.secondary_muscles || '[]', ex.equipment,
        ex.instructions, ex.video_url || null, ex.photo_url || null,
        ex.tracking_type || 'reps_weight'
      );
    }
  })();
  console.log(`  -> Seeded ${exercises.length} exercises.`);

  // ─── SEED FOOD ITEMS ───
  console.log("Seeding food items...");
  const insertFood = db.prepare(
    `INSERT OR IGNORE INTO food_items (name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  db.transaction(() => {
    for (const f of foods) {
      insertFood.run(f.name, f.brand, f.serving_size, f.serving_unit, f.calories, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g, f.sugar_g, f.sodium_mg, f.is_verified);
    }
  })();
  console.log(`  -> Seeded ${foods.length} food items.`);

  // ─── BUILD EXERCISE NAME->ID MAP ───
  const exerciseMap = {};
  const allExercises = db.prepare("SELECT id, name FROM exercises").all();
  for (const row of allExercises) {
    exerciseMap[row.name] = row.id;
  }

  // ─── FIND OR CREATE ADMIN USER FOR TEMPLATE OWNERSHIP ───
  let adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  let adminId;
  if (adminUser) {
    adminId = adminUser.id;
  } else {
    // Create a system user for seed data
    const bcrypt = require("bcryptjs");
    const hash = bcrypt.hashSync("admin123", 10);
    const result = db.prepare(
      "INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, status) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("admin@fittracker.app", hash, "Admin", "User", "admin", "active");
    adminId = result.lastInsertRowid || db.prepare("SELECT id FROM users WHERE email = 'admin@fittracker.app'").get().id;
  }

  // ─── SEED WORKOUT TEMPLATES ───
  console.log("Seeding workout templates...");
  const insertTemplate = db.prepare(
    `INSERT OR IGNORE INTO workout_templates (name, description, category, difficulty, estimated_duration_min, is_public, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertTemplateExercise = db.prepare(
    `INSERT OR IGNORE INTO template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  let templatesCreated = 0;
  let exercisesLinked = 0;

  db.transaction(() => {
    for (const tmpl of workoutTemplates) {
      insertTemplate.run(
        tmpl.name, tmpl.description, tmpl.category, tmpl.difficulty,
        tmpl.estimated_duration_min, tmpl.is_public, adminId
      );

      // Get the template ID
      const row = db.prepare("SELECT id FROM workout_templates WHERE name = ?").get(tmpl.name);
      if (!row) continue;
      const templateId = row.id;
      templatesCreated++;

      // Link exercises to template
      for (const ex of tmpl.exercises) {
        const exerciseId = exerciseMap[ex.name];
        if (!exerciseId) {
          console.warn(`  !! Exercise not found: "${ex.name}" (skipping)`);
          continue;
        }
        insertTemplateExercise.run(
          templateId, exerciseId, ex.sort_order,
          ex.target_sets, ex.target_reps, ex.rest_seconds,
          ex.notes || null
        );
        exercisesLinked++;
      }
    }
  })();
  console.log(`  -> Seeded ${templatesCreated} workout templates with ${exercisesLinked} exercise links.`);

  console.log("\nSeed complete!");
  closeDb();
}

main();
