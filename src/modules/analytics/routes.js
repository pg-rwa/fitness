const { Router } = require("express");
const { authenticate } = require("../../shared/middleware/authenticate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

// Analytics endpoints
router.get("/stats", controller.overallStats);
router.get("/workouts", controller.workoutSummary);
router.get("/workouts/muscle-groups", controller.muscleGroupBreakdown);
router.get("/nutrition", controller.nutritionSummary);

// CSV exports
router.get("/export/workouts", controller.exportWorkouts);
router.get("/export/nutrition", controller.exportNutrition);
router.get("/export/measurements", controller.exportMeasurements);

module.exports = router;
