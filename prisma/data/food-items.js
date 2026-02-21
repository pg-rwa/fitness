/**
 * Comprehensive food database with full macronutrient data.
 * All values are per the listed serving_size / serving_unit.
 * Sources: USDA FoodData Central, standard nutrition labels.
 */

const foodItems = [
  // ─── PROTEIN SOURCES ────────────────────────────────────────
  { name: "Chicken Breast (skinless)", brand: null, serving_size: 100, serving_unit: "g", calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, sugar_g: 0, sodium_mg: 74, is_verified: 1 },
  { name: "Chicken Thigh (skinless)", brand: null, serving_size: 100, serving_unit: "g", calories: 209, protein_g: 26, carbs_g: 0, fat_g: 10.9, fiber_g: 0, sugar_g: 0, sodium_mg: 84, is_verified: 1 },
  { name: "Turkey Breast", brand: null, serving_size: 100, serving_unit: "g", calories: 135, protein_g: 30, carbs_g: 0, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 54, is_verified: 1 },
  { name: "Ground Turkey (93% lean)", brand: null, serving_size: 100, serving_unit: "g", calories: 170, protein_g: 21, carbs_g: 0, fat_g: 9.4, fiber_g: 0, sugar_g: 0, sodium_mg: 72, is_verified: 1 },
  { name: "Salmon Fillet", brand: null, serving_size: 100, serving_unit: "g", calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0, sugar_g: 0, sodium_mg: 59, is_verified: 1 },
  { name: "Tuna (canned in water)", brand: null, serving_size: 100, serving_unit: "g", calories: 116, protein_g: 26, carbs_g: 0, fat_g: 0.8, fiber_g: 0, sugar_g: 0, sodium_mg: 338, is_verified: 1 },
  { name: "Tilapia", brand: null, serving_size: 100, serving_unit: "g", calories: 96, protein_g: 20, carbs_g: 0, fat_g: 1.7, fiber_g: 0, sugar_g: 0, sodium_mg: 52, is_verified: 1 },
  { name: "Shrimp", brand: null, serving_size: 100, serving_unit: "g", calories: 99, protein_g: 24, carbs_g: 0.2, fat_g: 0.3, fiber_g: 0, sugar_g: 0, sodium_mg: 111, is_verified: 1 },
  { name: "Cod Fillet", brand: null, serving_size: 100, serving_unit: "g", calories: 82, protein_g: 18, carbs_g: 0, fat_g: 0.7, fiber_g: 0, sugar_g: 0, sodium_mg: 54, is_verified: 1 },
  { name: "Ground Beef (90% lean)", brand: null, serving_size: 100, serving_unit: "g", calories: 176, protein_g: 20, carbs_g: 0, fat_g: 10, fiber_g: 0, sugar_g: 0, sodium_mg: 66, is_verified: 1 },
  { name: "Ground Beef (80% lean)", brand: null, serving_size: 100, serving_unit: "g", calories: 254, protein_g: 17, carbs_g: 0, fat_g: 20, fiber_g: 0, sugar_g: 0, sodium_mg: 66, is_verified: 1 },
  { name: "Beef Sirloin Steak", brand: null, serving_size: 100, serving_unit: "g", calories: 183, protein_g: 27, carbs_g: 0, fat_g: 8, fiber_g: 0, sugar_g: 0, sodium_mg: 56, is_verified: 1 },
  { name: "Pork Tenderloin", brand: null, serving_size: 100, serving_unit: "g", calories: 143, protein_g: 26, carbs_g: 0, fat_g: 3.5, fiber_g: 0, sugar_g: 0, sodium_mg: 48, is_verified: 1 },
  { name: "Pork Chop (boneless)", brand: null, serving_size: 100, serving_unit: "g", calories: 231, protein_g: 25, carbs_g: 0, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 62, is_verified: 1 },
  { name: "Lamb Loin", brand: null, serving_size: 100, serving_unit: "g", calories: 250, protein_g: 26, carbs_g: 0, fat_g: 16, fiber_g: 0, sugar_g: 0, sodium_mg: 59, is_verified: 1 },
  { name: "Bison (ground)", brand: null, serving_size: 100, serving_unit: "g", calories: 146, protein_g: 20, carbs_g: 0, fat_g: 7, fiber_g: 0, sugar_g: 0, sodium_mg: 68, is_verified: 1 },
  { name: "Whole Eggs", brand: null, serving_size: 50, serving_unit: "g", calories: 78, protein_g: 6, carbs_g: 0.6, fat_g: 5, fiber_g: 0, sugar_g: 0.6, sodium_mg: 62, is_verified: 1 },
  { name: "Egg Whites", brand: null, serving_size: 100, serving_unit: "g", calories: 52, protein_g: 11, carbs_g: 0.7, fat_g: 0.2, fiber_g: 0, sugar_g: 0.7, sodium_mg: 166, is_verified: 1 },
  { name: "Tofu (firm)", brand: null, serving_size: 100, serving_unit: "g", calories: 144, protein_g: 17, carbs_g: 3, fat_g: 8.7, fiber_g: 2.3, sugar_g: 0, sodium_mg: 14, is_verified: 1 },
  { name: "Tempeh", brand: null, serving_size: 100, serving_unit: "g", calories: 192, protein_g: 20, carbs_g: 8, fat_g: 11, fiber_g: 0, sugar_g: 0, sodium_mg: 9, is_verified: 1 },
  { name: "Edamame", brand: null, serving_size: 100, serving_unit: "g", calories: 121, protein_g: 12, carbs_g: 8.9, fat_g: 5.2, fiber_g: 5.2, sugar_g: 2.2, sodium_mg: 6, is_verified: 1 },

  // ─── DAIRY & PROTEIN SUPPLEMENTS ────────────────────────────
  { name: "Greek Yogurt (plain, nonfat)", brand: null, serving_size: 170, serving_unit: "g", calories: 100, protein_g: 17, carbs_g: 6, fat_g: 0.7, fiber_g: 0, sugar_g: 6, sodium_mg: 61, is_verified: 1 },
  { name: "Greek Yogurt (full fat)", brand: null, serving_size: 170, serving_unit: "g", calories: 165, protein_g: 15, carbs_g: 7, fat_g: 9, fiber_g: 0, sugar_g: 7, sodium_mg: 55, is_verified: 1 },
  { name: "Cottage Cheese (low fat)", brand: null, serving_size: 113, serving_unit: "g", calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3, fiber_g: 0, sugar_g: 2.7, sodium_mg: 364, is_verified: 1 },
  { name: "Milk (whole)", brand: null, serving_size: 240, serving_unit: "ml", calories: 149, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0, sugar_g: 12, sodium_mg: 105, is_verified: 1 },
  { name: "Milk (2%)", brand: null, serving_size: 240, serving_unit: "ml", calories: 122, protein_g: 8, carbs_g: 12, fat_g: 5, fiber_g: 0, sugar_g: 12, sodium_mg: 115, is_verified: 1 },
  { name: "Milk (skim)", brand: null, serving_size: 240, serving_unit: "ml", calories: 83, protein_g: 8, carbs_g: 12, fat_g: 0.2, fiber_g: 0, sugar_g: 12, sodium_mg: 103, is_verified: 1 },
  { name: "Cheddar Cheese", brand: null, serving_size: 28, serving_unit: "g", calories: 113, protein_g: 7, carbs_g: 0.4, fat_g: 9.3, fiber_g: 0, sugar_g: 0.1, sodium_mg: 176, is_verified: 1 },
  { name: "Mozzarella Cheese", brand: null, serving_size: 28, serving_unit: "g", calories: 85, protein_g: 6, carbs_g: 0.7, fat_g: 6.3, fiber_g: 0, sugar_g: 0.3, sodium_mg: 138, is_verified: 1 },
  { name: "Parmesan Cheese", brand: null, serving_size: 10, serving_unit: "g", calories: 43, protein_g: 3.9, carbs_g: 0.3, fat_g: 2.9, fiber_g: 0, sugar_g: 0.1, sodium_mg: 76, is_verified: 1 },
  { name: "Whey Protein Powder", brand: "Generic", serving_size: 30, serving_unit: "g", calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1, fiber_g: 0, sugar_g: 1, sodium_mg: 130, is_verified: 1 },
  { name: "Casein Protein Powder", brand: "Generic", serving_size: 33, serving_unit: "g", calories: 120, protein_g: 24, carbs_g: 3, fat_g: 0.5, fiber_g: 0, sugar_g: 1, sodium_mg: 160, is_verified: 1 },
  { name: "Plant Protein Powder (Pea)", brand: "Generic", serving_size: 33, serving_unit: "g", calories: 120, protein_g: 21, carbs_g: 6, fat_g: 1.5, fiber_g: 1, sugar_g: 0, sodium_mg: 390, is_verified: 1 },

  // ─── GRAINS & CARBOHYDRATES ─────────────────────────────────
  { name: "Brown Rice (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 123, protein_g: 2.7, carbs_g: 25.6, fat_g: 1, fiber_g: 1.6, sugar_g: 0.4, sodium_mg: 4, is_verified: 1 },
  { name: "White Rice (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0, sodium_mg: 1, is_verified: 1 },
  { name: "Jasmine Rice (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 129, protein_g: 2.4, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0, sodium_mg: 1, is_verified: 1 },
  { name: "Basmati Rice (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 121, protein_g: 3.5, carbs_g: 25, fat_g: 0.4, fiber_g: 0.4, sugar_g: 0, sodium_mg: 1, is_verified: 1 },
  { name: "Quinoa (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 120, protein_g: 4.4, carbs_g: 21, fat_g: 1.9, fiber_g: 2.8, sugar_g: 0.9, sodium_mg: 7, is_verified: 1 },
  { name: "Oatmeal (dry)", brand: null, serving_size: 40, serving_unit: "g", calories: 154, protein_g: 5, carbs_g: 27, fat_g: 2.5, fiber_g: 4, sugar_g: 0.4, sodium_mg: 2, is_verified: 1 },
  { name: "Pasta (whole wheat, cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 124, protein_g: 5, carbs_g: 27, fat_g: 0.5, fiber_g: 3.9, sugar_g: 0.6, sodium_mg: 3, is_verified: 1 },
  { name: "Pasta (white, cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1, fiber_g: 1.8, sugar_g: 0.6, sodium_mg: 1, is_verified: 1 },
  { name: "Whole Wheat Bread", brand: null, serving_size: 28, serving_unit: "g", calories: 69, protein_g: 3.6, carbs_g: 12, fat_g: 1.1, fiber_g: 1.9, sugar_g: 1.4, sodium_mg: 132, is_verified: 1 },
  { name: "White Bread", brand: null, serving_size: 25, serving_unit: "g", calories: 67, protein_g: 2, carbs_g: 13, fat_g: 0.8, fiber_g: 0.6, sugar_g: 1.5, sodium_mg: 142, is_verified: 1 },
  { name: "Sourdough Bread", brand: null, serving_size: 36, serving_unit: "g", calories: 93, protein_g: 4, carbs_g: 18, fat_g: 0.6, fiber_g: 0.8, sugar_g: 0, sodium_mg: 208, is_verified: 1 },
  { name: "Tortilla (flour, 8 inch)", brand: null, serving_size: 45, serving_unit: "g", calories: 140, protein_g: 3.6, carbs_g: 24, fat_g: 3.5, fiber_g: 1, sugar_g: 1, sodium_mg: 331, is_verified: 1 },
  { name: "Tortilla (corn)", brand: null, serving_size: 26, serving_unit: "g", calories: 52, protein_g: 1.4, carbs_g: 11, fat_g: 0.7, fiber_g: 1.5, sugar_g: 0.2, sodium_mg: 11, is_verified: 1 },
  { name: "Couscous (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 112, protein_g: 3.8, carbs_g: 23, fat_g: 0.2, fiber_g: 1.4, sugar_g: 0.1, sodium_mg: 5, is_verified: 1 },
  { name: "Granola", brand: null, serving_size: 40, serving_unit: "g", calories: 196, protein_g: 4.4, carbs_g: 26, fat_g: 9, fiber_g: 2.8, sugar_g: 10, sodium_mg: 10, is_verified: 1 },
  { name: "Rice Cakes (plain)", brand: null, serving_size: 9, serving_unit: "g", calories: 35, protein_g: 0.7, carbs_g: 7.3, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0, sodium_mg: 29, is_verified: 1 },

  // ─── STARCHY VEGETABLES ─────────────────────────────────────
  { name: "Sweet Potato", brand: null, serving_size: 100, serving_unit: "g", calories: 86, protein_g: 1.6, carbs_g: 20, fat_g: 0.1, fiber_g: 3, sugar_g: 4.2, sodium_mg: 55, is_verified: 1 },
  { name: "White Potato", brand: null, serving_size: 100, serving_unit: "g", calories: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1, fiber_g: 2.2, sugar_g: 0.8, sodium_mg: 6, is_verified: 1 },
  { name: "Corn (kernels)", brand: null, serving_size: 100, serving_unit: "g", calories: 86, protein_g: 3.3, carbs_g: 19, fat_g: 1.2, fiber_g: 2.7, sugar_g: 3.2, sodium_mg: 15, is_verified: 1 },
  { name: "Butternut Squash", brand: null, serving_size: 100, serving_unit: "g", calories: 45, protein_g: 1, carbs_g: 12, fat_g: 0.1, fiber_g: 2, sugar_g: 2.2, sodium_mg: 4, is_verified: 1 },

  // ─── VEGETABLES ─────────────────────────────────────────────
  { name: "Broccoli", brand: null, serving_size: 100, serving_unit: "g", calories: 34, protein_g: 2.8, carbs_g: 7, fat_g: 0.4, fiber_g: 2.6, sugar_g: 1.7, sodium_mg: 33, is_verified: 1 },
  { name: "Spinach (raw)", brand: null, serving_size: 100, serving_unit: "g", calories: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2, sugar_g: 0.4, sodium_mg: 79, is_verified: 1 },
  { name: "Kale (raw)", brand: null, serving_size: 100, serving_unit: "g", calories: 49, protein_g: 4.3, carbs_g: 9, fat_g: 0.9, fiber_g: 3.6, sugar_g: 2.3, sodium_mg: 38, is_verified: 1 },
  { name: "Green Beans", brand: null, serving_size: 100, serving_unit: "g", calories: 31, protein_g: 1.8, carbs_g: 7, fat_g: 0.1, fiber_g: 3.4, sugar_g: 1.4, sodium_mg: 6, is_verified: 1 },
  { name: "Asparagus", brand: null, serving_size: 100, serving_unit: "g", calories: 20, protein_g: 2.2, carbs_g: 3.9, fat_g: 0.1, fiber_g: 2.1, sugar_g: 1.9, sodium_mg: 2, is_verified: 1 },
  { name: "Bell Pepper (mixed)", brand: null, serving_size: 100, serving_unit: "g", calories: 31, protein_g: 1, carbs_g: 6, fat_g: 0.3, fiber_g: 2.1, sugar_g: 4.2, sodium_mg: 4, is_verified: 1 },
  { name: "Tomato", brand: null, serving_size: 100, serving_unit: "g", calories: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, sugar_g: 2.6, sodium_mg: 5, is_verified: 1 },
  { name: "Cucumber", brand: null, serving_size: 100, serving_unit: "g", calories: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, sugar_g: 1.7, sodium_mg: 2, is_verified: 1 },
  { name: "Onion", brand: null, serving_size: 100, serving_unit: "g", calories: 40, protein_g: 1.1, carbs_g: 9.3, fat_g: 0.1, fiber_g: 1.7, sugar_g: 4.2, sodium_mg: 4, is_verified: 1 },
  { name: "Mushrooms (white)", brand: null, serving_size: 100, serving_unit: "g", calories: 22, protein_g: 3.1, carbs_g: 3.3, fat_g: 0.3, fiber_g: 1, sugar_g: 2, sodium_mg: 5, is_verified: 1 },
  { name: "Zucchini", brand: null, serving_size: 100, serving_unit: "g", calories: 17, protein_g: 1.2, carbs_g: 3.1, fat_g: 0.3, fiber_g: 1, sugar_g: 2.5, sodium_mg: 8, is_verified: 1 },
  { name: "Cauliflower", brand: null, serving_size: 100, serving_unit: "g", calories: 25, protein_g: 1.9, carbs_g: 5, fat_g: 0.3, fiber_g: 2, sugar_g: 1.9, sodium_mg: 30, is_verified: 1 },
  { name: "Brussels Sprouts", brand: null, serving_size: 100, serving_unit: "g", calories: 43, protein_g: 3.4, carbs_g: 9, fat_g: 0.3, fiber_g: 3.8, sugar_g: 2.2, sodium_mg: 25, is_verified: 1 },
  { name: "Carrots", brand: null, serving_size: 100, serving_unit: "g", calories: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, fiber_g: 2.8, sugar_g: 4.7, sodium_mg: 69, is_verified: 1 },
  { name: "Celery", brand: null, serving_size: 100, serving_unit: "g", calories: 14, protein_g: 0.7, carbs_g: 3, fat_g: 0.2, fiber_g: 1.6, sugar_g: 1.3, sodium_mg: 80, is_verified: 1 },
  { name: "Cabbage", brand: null, serving_size: 100, serving_unit: "g", calories: 25, protein_g: 1.3, carbs_g: 6, fat_g: 0.1, fiber_g: 2.5, sugar_g: 3.2, sodium_mg: 18, is_verified: 1 },
  { name: "Lettuce (romaine)", brand: null, serving_size: 100, serving_unit: "g", calories: 17, protein_g: 1.2, carbs_g: 3.3, fat_g: 0.3, fiber_g: 2.1, sugar_g: 1.2, sodium_mg: 8, is_verified: 1 },

  // ─── FRUITS ─────────────────────────────────────────────────
  { name: "Banana", brand: null, serving_size: 118, serving_unit: "g", calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, fiber_g: 3.1, sugar_g: 14, sodium_mg: 1, is_verified: 1 },
  { name: "Apple", brand: null, serving_size: 182, serving_unit: "g", calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, fiber_g: 4.4, sugar_g: 19, sodium_mg: 2, is_verified: 1 },
  { name: "Blueberries", brand: null, serving_size: 100, serving_unit: "g", calories: 57, protein_g: 0.7, carbs_g: 14, fat_g: 0.3, fiber_g: 2.4, sugar_g: 10, sodium_mg: 1, is_verified: 1 },
  { name: "Strawberries", brand: null, serving_size: 100, serving_unit: "g", calories: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3, fiber_g: 2, sugar_g: 4.9, sodium_mg: 1, is_verified: 1 },
  { name: "Orange", brand: null, serving_size: 131, serving_unit: "g", calories: 62, protein_g: 1.2, carbs_g: 15, fat_g: 0.2, fiber_g: 3.1, sugar_g: 12, sodium_mg: 0, is_verified: 1 },
  { name: "Grapes", brand: null, serving_size: 100, serving_unit: "g", calories: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2, fiber_g: 0.9, sugar_g: 16, sodium_mg: 2, is_verified: 1 },
  { name: "Mango", brand: null, serving_size: 100, serving_unit: "g", calories: 60, protein_g: 0.8, carbs_g: 15, fat_g: 0.4, fiber_g: 1.6, sugar_g: 14, sodium_mg: 1, is_verified: 1 },
  { name: "Pineapple", brand: null, serving_size: 100, serving_unit: "g", calories: 50, protein_g: 0.5, carbs_g: 13, fat_g: 0.1, fiber_g: 1.4, sugar_g: 10, sodium_mg: 1, is_verified: 1 },
  { name: "Watermelon", brand: null, serving_size: 100, serving_unit: "g", calories: 30, protein_g: 0.6, carbs_g: 8, fat_g: 0.2, fiber_g: 0.4, sugar_g: 6, sodium_mg: 1, is_verified: 1 },
  { name: "Avocado", brand: null, serving_size: 100, serving_unit: "g", calories: 160, protein_g: 2, carbs_g: 9, fat_g: 15, fiber_g: 7, sugar_g: 0.7, sodium_mg: 7, is_verified: 1 },
  { name: "Dates (Medjool)", brand: null, serving_size: 24, serving_unit: "g", calories: 66, protein_g: 0.4, carbs_g: 18, fat_g: 0, fiber_g: 1.6, sugar_g: 16, sodium_mg: 0, is_verified: 1 },
  { name: "Raisins", brand: null, serving_size: 28, serving_unit: "g", calories: 85, protein_g: 0.9, carbs_g: 22, fat_g: 0.1, fiber_g: 1.1, sugar_g: 17, sodium_mg: 3, is_verified: 1 },

  // ─── HEALTHY FATS & NUTS ────────────────────────────────────
  { name: "Almonds", brand: null, serving_size: 28, serving_unit: "g", calories: 164, protein_g: 6, carbs_g: 6, fat_g: 14, fiber_g: 3.5, sugar_g: 1.2, sodium_mg: 0, is_verified: 1 },
  { name: "Walnuts", brand: null, serving_size: 28, serving_unit: "g", calories: 185, protein_g: 4.3, carbs_g: 3.9, fat_g: 18, fiber_g: 1.9, sugar_g: 0.7, sodium_mg: 1, is_verified: 1 },
  { name: "Cashews", brand: null, serving_size: 28, serving_unit: "g", calories: 157, protein_g: 5.2, carbs_g: 8.6, fat_g: 12, fiber_g: 0.9, sugar_g: 1.7, sodium_mg: 3, is_verified: 1 },
  { name: "Peanuts (dry roasted)", brand: null, serving_size: 28, serving_unit: "g", calories: 166, protein_g: 7, carbs_g: 6, fat_g: 14, fiber_g: 2.3, sugar_g: 1.2, sodium_mg: 2, is_verified: 1 },
  { name: "Peanut Butter (natural)", brand: null, serving_size: 32, serving_unit: "g", calories: 188, protein_g: 8, carbs_g: 6, fat_g: 16, fiber_g: 2, sugar_g: 3, sodium_mg: 5, is_verified: 1 },
  { name: "Almond Butter", brand: null, serving_size: 32, serving_unit: "g", calories: 196, protein_g: 6.8, carbs_g: 6, fat_g: 18, fiber_g: 3.3, sugar_g: 2, sodium_mg: 2, is_verified: 1 },
  { name: "Chia Seeds", brand: null, serving_size: 28, serving_unit: "g", calories: 138, protein_g: 4.7, carbs_g: 12, fat_g: 8.7, fiber_g: 9.8, sugar_g: 0, sodium_mg: 5, is_verified: 1 },
  { name: "Flax Seeds (ground)", brand: null, serving_size: 10, serving_unit: "g", calories: 55, protein_g: 1.9, carbs_g: 3, fat_g: 4.3, fiber_g: 2.8, sugar_g: 0.2, sodium_mg: 3, is_verified: 1 },
  { name: "Pumpkin Seeds", brand: null, serving_size: 28, serving_unit: "g", calories: 163, protein_g: 8.5, carbs_g: 4, fat_g: 14, fiber_g: 1.7, sugar_g: 0.3, sodium_mg: 5, is_verified: 1 },
  { name: "Sunflower Seeds", brand: null, serving_size: 28, serving_unit: "g", calories: 165, protein_g: 5.5, carbs_g: 6.5, fat_g: 14, fiber_g: 3, sugar_g: 0.8, sodium_mg: 1, is_verified: 1 },
  { name: "Olive Oil", brand: null, serving_size: 14, serving_unit: "ml", calories: 119, protein_g: 0, carbs_g: 0, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 0, is_verified: 1 },
  { name: "Coconut Oil", brand: null, serving_size: 14, serving_unit: "ml", calories: 121, protein_g: 0, carbs_g: 0, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 0, is_verified: 1 },
  { name: "Butter", brand: null, serving_size: 14, serving_unit: "g", calories: 102, protein_g: 0.1, carbs_g: 0, fat_g: 12, fiber_g: 0, sugar_g: 0, sodium_mg: 2, is_verified: 1 },
  { name: "Ghee", brand: null, serving_size: 14, serving_unit: "g", calories: 123, protein_g: 0, carbs_g: 0, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 0, is_verified: 1 },

  // ─── LEGUMES & BEANS ────────────────────────────────────────
  { name: "Black Beans (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 132, protein_g: 8.9, carbs_g: 24, fat_g: 0.5, fiber_g: 8.7, sugar_g: 0.3, sodium_mg: 1, is_verified: 1 },
  { name: "Chickpeas (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 164, protein_g: 8.9, carbs_g: 27, fat_g: 2.6, fiber_g: 7.6, sugar_g: 4.8, sodium_mg: 7, is_verified: 1 },
  { name: "Lentils (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, fiber_g: 7.9, sugar_g: 1.8, sodium_mg: 2, is_verified: 1 },
  { name: "Kidney Beans (cooked)", brand: null, serving_size: 100, serving_unit: "g", calories: 127, protein_g: 8.7, carbs_g: 23, fat_g: 0.5, fiber_g: 6.4, sugar_g: 2.1, sodium_mg: 2, is_verified: 1 },
  { name: "Hummus", brand: null, serving_size: 30, serving_unit: "g", calories: 52, protein_g: 2.4, carbs_g: 4.6, fat_g: 3, fiber_g: 1.5, sugar_g: 0.1, sodium_mg: 106, is_verified: 1 },

  // ─── BEVERAGES ──────────────────────────────────────────────
  { name: "Orange Juice (fresh)", brand: null, serving_size: 240, serving_unit: "ml", calories: 112, protein_g: 1.7, carbs_g: 26, fat_g: 0.5, fiber_g: 0.5, sugar_g: 21, sodium_mg: 2, is_verified: 1 },
  { name: "Coconut Water", brand: null, serving_size: 240, serving_unit: "ml", calories: 46, protein_g: 1.7, carbs_g: 9, fat_g: 0.5, fiber_g: 2.6, sugar_g: 6, sodium_mg: 252, is_verified: 1 },
  { name: "Almond Milk (unsweetened)", brand: null, serving_size: 240, serving_unit: "ml", calories: 30, protein_g: 1, carbs_g: 1, fat_g: 2.5, fiber_g: 0, sugar_g: 0, sodium_mg: 170, is_verified: 1 },
  { name: "Oat Milk", brand: null, serving_size: 240, serving_unit: "ml", calories: 120, protein_g: 3, carbs_g: 16, fat_g: 5, fiber_g: 2, sugar_g: 7, sodium_mg: 101, is_verified: 1 },
  { name: "Protein Shake (ready-to-drink)", brand: "Generic", serving_size: 330, serving_unit: "ml", calories: 160, protein_g: 30, carbs_g: 6, fat_g: 2.5, fiber_g: 0, sugar_g: 1, sodium_mg: 240, is_verified: 1 },

  // ─── SNACKS & CONVENIENCE ───────────────────────────────────
  { name: "Protein Bar", brand: "Generic", serving_size: 60, serving_unit: "g", calories: 210, protein_g: 20, carbs_g: 22, fat_g: 7, fiber_g: 4, sugar_g: 4, sodium_mg: 200, is_verified: 1 },
  { name: "Beef Jerky", brand: null, serving_size: 28, serving_unit: "g", calories: 82, protein_g: 10, carbs_g: 5, fat_g: 2, fiber_g: 0, sugar_g: 4, sodium_mg: 418, is_verified: 1 },
  { name: "Dark Chocolate (85%)", brand: null, serving_size: 28, serving_unit: "g", calories: 170, protein_g: 2.2, carbs_g: 13, fat_g: 12, fiber_g: 3.1, sugar_g: 5, sodium_mg: 6, is_verified: 1 },
  { name: "Trail Mix", brand: null, serving_size: 40, serving_unit: "g", calories: 200, protein_g: 5, carbs_g: 18, fat_g: 13, fiber_g: 2, sugar_g: 10, sodium_mg: 45, is_verified: 1 },
  { name: "Popcorn (air-popped)", brand: null, serving_size: 28, serving_unit: "g", calories: 110, protein_g: 3, carbs_g: 22, fat_g: 1.3, fiber_g: 4, sugar_g: 0, sodium_mg: 1, is_verified: 1 },

  // ─── CONDIMENTS & SAUCES ────────────────────────────────────
  { name: "Honey", brand: null, serving_size: 21, serving_unit: "g", calories: 64, protein_g: 0.1, carbs_g: 17, fat_g: 0, fiber_g: 0, sugar_g: 17, sodium_mg: 1, is_verified: 1 },
  { name: "Maple Syrup", brand: null, serving_size: 20, serving_unit: "ml", calories: 52, protein_g: 0, carbs_g: 13, fat_g: 0, fiber_g: 0, sugar_g: 12, sodium_mg: 2, is_verified: 1 },
  { name: "Soy Sauce", brand: null, serving_size: 15, serving_unit: "ml", calories: 9, protein_g: 0.8, carbs_g: 1, fat_g: 0, fiber_g: 0, sugar_g: 0.2, sodium_mg: 879, is_verified: 1 },
  { name: "Hot Sauce", brand: null, serving_size: 5, serving_unit: "ml", calories: 1, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 124, is_verified: 1 },
  { name: "Salsa", brand: null, serving_size: 30, serving_unit: "g", calories: 10, protein_g: 0.5, carbs_g: 2, fat_g: 0, fiber_g: 0.5, sugar_g: 1.3, sodium_mg: 200, is_verified: 1 },
  { name: "Balsamic Vinegar", brand: null, serving_size: 15, serving_unit: "ml", calories: 14, protein_g: 0, carbs_g: 2.7, fat_g: 0, fiber_g: 0, sugar_g: 2.4, sodium_mg: 4, is_verified: 1 },
  { name: "Mayonnaise", brand: null, serving_size: 14, serving_unit: "g", calories: 94, protein_g: 0.1, carbs_g: 0, fat_g: 10, fiber_g: 0, sugar_g: 0, sodium_mg: 88, is_verified: 1 },
  { name: "Ketchup", brand: null, serving_size: 17, serving_unit: "g", calories: 20, protein_g: 0, carbs_g: 5, fat_g: 0, fiber_g: 0, sugar_g: 4, sodium_mg: 154, is_verified: 1 },
  { name: "Mustard", brand: null, serving_size: 5, serving_unit: "g", calories: 3, protein_g: 0.2, carbs_g: 0.3, fat_g: 0.2, fiber_g: 0.2, sugar_g: 0.1, sodium_mg: 55, is_verified: 1 },
  { name: "Cream Cheese", brand: null, serving_size: 28, serving_unit: "g", calories: 99, protein_g: 1.7, carbs_g: 1.6, fat_g: 10, fiber_g: 0, sugar_g: 0.7, sodium_mg: 91, is_verified: 1 },
  { name: "Guacamole", brand: null, serving_size: 30, serving_unit: "g", calories: 50, protein_g: 0.6, carbs_g: 3, fat_g: 4.5, fiber_g: 2, sugar_g: 0.2, sodium_mg: 115, is_verified: 1 },
];

module.exports = foodItems;
