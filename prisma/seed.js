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

const foods = [
  { name: "Chicken Breast", brand: null, serving_size: 100, serving_unit: "g", calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, sugar_g: 0, sodium_mg: 74, is_verified: 1 },
  { name: "Brown Rice", brand: null, serving_size: 100, serving_unit: "g", calories: 123, protein_g: 2.7, carbs_g: 25.6, fat_g: 1, fiber_g: 1.6, sugar_g: 0.4, sodium_mg: 4, is_verified: 1 },
  { name: "Broccoli", brand: null, serving_size: 100, serving_unit: "g", calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, fiber_g: 2.6, sugar_g: 1.7, sodium_mg: 33, is_verified: 1 },
  { name: "Salmon Fillet", brand: null, serving_size: 100, serving_unit: "g", calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0, sugar_g: 0, sodium_mg: 59, is_verified: 1 },
  { name: "Whole Eggs", brand: null, serving_size: 50, serving_unit: "g", calories: 78, protein_g: 6, carbs_g: 0.6, fat_g: 5, fiber_g: 0, sugar_g: 0.6, sodium_mg: 62, is_verified: 1 },
  { name: "Oatmeal", brand: null, serving_size: 40, serving_unit: "g", calories: 154, protein_g: 5, carbs_g: 27, fat_g: 2.5, fiber_g: 4, sugar_g: 0.4, sodium_mg: 2, is_verified: 1 },
  { name: "Greek Yogurt", brand: null, serving_size: 170, serving_unit: "g", calories: 100, protein_g: 17, carbs_g: 6, fat_g: 0.7, fiber_g: 0, sugar_g: 6, sodium_mg: 61, is_verified: 1 },
  { name: "Sweet Potato", brand: null, serving_size: 100, serving_unit: "g", calories: 86, protein_g: 1.6, carbs_g: 20, fat_g: 0.1, fiber_g: 3, sugar_g: 4.2, sodium_mg: 55, is_verified: 1 },
  { name: "Banana", brand: null, serving_size: 118, serving_unit: "g", calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, fiber_g: 3.1, sugar_g: 14, sodium_mg: 1, is_verified: 1 },
  { name: "Almonds", brand: null, serving_size: 28, serving_unit: "g", calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, fiber_g: 3.5, sugar_g: 1.2, sodium_mg: 0, is_verified: 1 },
  { name: "Avocado", brand: null, serving_size: 100, serving_unit: "g", calories: 160, protein_g: 2, carbs_g: 9, fat_g: 15, fiber_g: 7, sugar_g: 0.7, sodium_mg: 7, is_verified: 1 },
  { name: "White Rice", brand: null, serving_size: 100, serving_unit: "g", calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0, sodium_mg: 1, is_verified: 1 },
  { name: "Ground Beef (90% lean)", brand: null, serving_size: 100, serving_unit: "g", calories: 176, protein_g: 20, carbs_g: 0, fat_g: 10, fiber_g: 0, sugar_g: 0, sodium_mg: 66, is_verified: 1 },
  { name: "Whey Protein Shake", brand: "Generic", serving_size: 30, serving_unit: "g", calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1, fiber_g: 0, sugar_g: 1, sodium_mg: 130, is_verified: 1 },
  { name: "Olive Oil", brand: null, serving_size: 14, serving_unit: "ml", calories: 119, protein_g: 0, carbs_g: 0, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 0, is_verified: 1 },
  { name: "Peanut Butter", brand: null, serving_size: 32, serving_unit: "g", calories: 188, protein_g: 8, carbs_g: 6, fat_g: 16, fiber_g: 2, sugar_g: 3, sodium_mg: 136, is_verified: 1 },
  { name: "Cottage Cheese", brand: null, serving_size: 113, serving_unit: "g", calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, fiber_g: 0, sugar_g: 2.7, sodium_mg: 364, is_verified: 1 },
  { name: "Turkey Breast", brand: null, serving_size: 100, serving_unit: "g", calories: 135, protein_g: 30, carbs_g: 0, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 54, is_verified: 1 },
  { name: "Spinach", brand: null, serving_size: 100, serving_unit: "g", calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2, sugar_g: 0.4, sodium_mg: 79, is_verified: 1 },
  { name: "Whole Wheat Bread", brand: null, serving_size: 28, serving_unit: "g", calories: 69, protein_g: 3.6, carbs_g: 12, fat_g: 1.1, fiber_g: 1.9, sugar_g: 1.4, sodium_mg: 132, is_verified: 1 },
];

function main() {
  initDb();
  const db = getDb();

  console.log("Seeding exercises...");
  const insertExercise = db.prepare(
    "INSERT OR IGNORE INTO exercises (name, category, muscle_group, equipment) VALUES (?, ?, ?, ?)"
  );
  db.transaction(() => {
    for (const ex of exercises) {
      insertExercise.run(ex.name, ex.category, ex.muscle_group, ex.equipment);
    }
  })();
  console.log(`Seeded ${exercises.length} exercises.`);

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
  console.log(`Seeded ${foods.length} food items.`);

  closeDb();
}

main();
