const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.get("/client/:clientId", authorize("admin", "trainer"), controller.list);
router.get("/exercise-history/:exerciseId", controller.exerciseHistory);
router.get("/:id", controller.getById);

router.post(
  "/",
  [
    body("templateId").optional().isInt(),
    body("name").optional().trim().notEmpty(),
    body("notes").optional().isString(),
    body("moodBefore").optional().isInt({ min: 1, max: 10 }),
    validate,
  ],
  controller.create
);

router.post(
  "/:id/exercises",
  [
    body("exerciseId").isInt(),
    body("sortOrder").optional().isInt(),
    body("machineSettings").optional().isObject(),
    validate,
  ],
  controller.addExercise
);

router.post(
  "/:id/exercises/:seId/sets",
  [
    body("setType").optional().isIn(["warmup", "working", "dropset", "failure"]),
    body("reps").optional().isInt({ min: 0 }),
    body("weightKg").optional().isFloat({ min: 0 }),
    body("durationSec").optional().isInt({ min: 0 }),
    body("distanceM").optional().isFloat({ min: 0 }),
    body("rpe").optional().isInt({ min: 1, max: 10 }),
    body("completed").optional().isBoolean(),
    body("notes").optional().isString(),
    validate,
  ],
  controller.logSet
);

router.put(
  "/:id/exercises/:seId/sets/:setId",
  [
    body("setType").optional().isIn(["warmup", "working", "dropset", "failure"]),
    body("reps").optional().isInt({ min: 0 }),
    body("weightKg").optional().isFloat({ min: 0 }),
    body("rpe").optional().isInt({ min: 1, max: 10 }),
    body("completed").optional().isBoolean(),
    validate,
  ],
  controller.updateSet
);

router.put(
  "/:id/exercises/:seId/replace",
  [
    body("newExerciseId").isInt(),
    body("updateTemplate").optional().isBoolean(),
    validate,
  ],
  controller.replaceExercise
);

router.delete("/:id", controller.remove);

router.put(
  "/:id/complete",
  [
    body("moodAfter").optional().isInt({ min: 1, max: 10 }),
    body("notes").optional().isString(),
    validate,
  ],
  controller.complete
);

module.exports = router;
