const { Router } = require("express");
const { body, query } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");
const { uploadImage } = require("../../shared/middleware/upload");

const router = Router();
router.use(authenticate);

// AI meal photo analysis
router.post("/analyze-photo", uploadImage.single("photo"), controller.analyzeMealPhoto);

// Barcode lookup
router.get("/barcode/:barcode", controller.lookupBarcode);

// Food items
router.get("/foods", controller.searchFoods);
router.get("/foods/:id", controller.getFoodById);
router.post(
  "/foods",
  [
    body("name").trim().notEmpty(),
    body("calories").optional().isFloat({ min: 0 }),
    body("proteinG").optional().isFloat({ min: 0 }),
    body("carbsG").optional().isFloat({ min: 0 }),
    body("fatG").optional().isFloat({ min: 0 }),
    body("servingSize").optional().isFloat({ min: 0 }),
    body("servingUnit").optional().isString(),
    validate,
  ],
  controller.createFood
);
router.put("/foods/:id", controller.updateFood);

// Meal presets
router.get("/presets", controller.listPresets);
router.post(
  "/presets",
  authorize("admin", "trainer"),
  [
    body("name").trim().notEmpty(),
    body("mealType").optional().isIn(["breakfast", "lunch", "dinner", "snack", "any"]),
    body("isPublic").optional().isBoolean(),
    body("items").optional().isArray(),
    body("items.*.foodItemId").optional().isInt(),
    body("items.*.quantity").optional().isFloat({ min: 0 }),
    validate,
  ],
  controller.createPreset
);
router.delete("/presets/:id", controller.deletePreset);

// Meal logging
router.post(
  "/meals",
  [
    body("mealType").optional().isIn(["breakfast", "lunch", "dinner", "snack"]),
    body("loggedAt").optional().isISO8601(),
    body("items").isArray({ min: 1 }),
    body("items.*.foodItemId").isInt(),
    body("items.*.quantity").optional().isFloat({ min: 0 }),
    validate,
  ],
  controller.logMeal
);
router.get("/meals", controller.getMealsByDate);
router.delete("/meals/:id", controller.deleteMeal);

// Trainer views client meals
router.get("/meals/client/:clientId", authorize("admin", "trainer"), controller.getMealsByDate);

// Nutrition summary
router.get("/summary", controller.dailySummary);
router.get("/summary/client/:clientId", authorize("admin", "trainer"), controller.dailySummary);

// Nutrition targets (trainer sets for client)
router.put(
  "/targets/:clientId",
  authorize("admin", "trainer"),
  [
    body("calorieTarget").optional().isFloat({ min: 0 }),
    body("proteinTargetG").optional().isFloat({ min: 0 }),
    body("carbsTargetG").optional().isFloat({ min: 0 }),
    body("fatTargetG").optional().isFloat({ min: 0 }),
    validate,
  ],
  controller.setNutritionTargets
);

module.exports = router;
