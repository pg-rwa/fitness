const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const workoutController = require("../controllers/workouts");

const router = Router();

router.use(authenticate);

router.get("/", workoutController.list);
router.get("/:id", workoutController.getById);

router.post(
  "/",
  [body("name").trim().notEmpty(), body("notes").optional().isString(), validate],
  workoutController.create
);

router.post(
  "/:id/exercises",
  [
    body("exerciseId").isInt({ min: 1 }),
    body("sets").isArray({ min: 1 }),
    body("sets.*.reps").optional().isInt({ min: 0 }),
    body("sets.*.weightKg").optional().isFloat({ min: 0 }),
    body("sets.*.durationSec").optional().isInt({ min: 0 }),
    body("sets.*.distanceM").optional().isFloat({ min: 0 }),
    validate,
  ],
  workoutController.addExercise
);

router.put("/:id/complete", workoutController.complete);

module.exports = router;
