const { initDb, getDb, closeDb } = require("../src/config/database");

const exercises = [
  { name: "Barbell Bench Press", category: "strength", muscle_group: "chest", equipment: "barbell" },
  { name: "Incline Dumbbell Press", category: "strength", muscle_group: "chest", equipment: "dumbbell" },
  { name: "Push-Up", category: "strength", muscle_group: "chest", equipment: null },
  { name: "Barbell Squat", category: "strength", muscle_group: "legs", equipment: "barbell" },
  { name: "Leg Press", category: "strength", muscle_group: "legs", equipment: "machine" },
  { name: "Lunges", category: "strength", muscle_group: "legs", equipment: null },
  { name: "Deadlift", category: "strength", muscle_group: "back", equipment: "barbell" },
  { name: "Pull-Up", category: "strength", muscle_group: "back", equipment: "bodyweight" },
  { name: "Barbell Row", category: "strength", muscle_group: "back", equipment: "barbell" },
  { name: "Overhead Press", category: "strength", muscle_group: "shoulders", equipment: "barbell" },
  { name: "Lateral Raise", category: "strength", muscle_group: "shoulders", equipment: "dumbbell" },
  { name: "Barbell Curl", category: "strength", muscle_group: "arms", equipment: "barbell" },
  { name: "Tricep Dip", category: "strength", muscle_group: "arms", equipment: "bodyweight" },
  { name: "Plank", category: "strength", muscle_group: "core", equipment: null },
  { name: "Crunch", category: "strength", muscle_group: "core", equipment: null },
  { name: "Running", category: "cardio", muscle_group: "full body", equipment: null },
  { name: "Cycling", category: "cardio", muscle_group: "legs", equipment: "bike" },
  { name: "Rowing Machine", category: "cardio", muscle_group: "full body", equipment: "machine" },
  { name: "Jump Rope", category: "cardio", muscle_group: "full body", equipment: "jump rope" },
  { name: "Yoga Flow", category: "flexibility", muscle_group: "full body", equipment: null },
];

function main() {
  initDb();
  const db = getDb();

  console.log("Seeding exercises...");

  const insert = db.prepare(
    "INSERT OR IGNORE INTO exercises (name, category, muscle_group, equipment) VALUES (?, ?, ?, ?)"
  );

  const insertMany = db.transaction((items) => {
    for (const ex of items) {
      insert.run(ex.name, ex.category, ex.muscle_group, ex.equipment);
    }
  });

  insertMany(exercises);
  console.log(`Seeded ${exercises.length} exercises.`);
  closeDb();
}

main();
