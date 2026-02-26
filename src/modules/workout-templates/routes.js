const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

// Trainer views client's templates (must be before /:id)
router.get("/client/:clientId", authorize("admin", "trainer"), controller.listClientTemplates);

router.get("/", controller.list);
router.get("/:id", controller.getById);

router.post(
  "/",
  [
    body("name").trim().notEmpty(),
    body("description").optional().isString(),
    body("category").optional().isString(),
    body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("estimatedDurationMin").optional().isInt({ min: 1 }),
    body("isPublic").optional().isBoolean(),
    validate,
  ],
  controller.create
);

router.put(
  "/:id",
  [
    body("name").optional().trim().notEmpty(),
    body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("isPublic").optional().isBoolean(),
    validate,
  ],
  controller.update
);

router.delete("/:id", controller.remove);

router.post(
  "/:id/exercises",
  [
    body("exerciseId").isInt(),
    body("sortOrder").optional().isInt(),
    body("targetSets").optional().isInt({ min: 1 }),
    body("targetReps").optional().isInt({ min: 1 }),
    body("targetWeightKg").optional().isFloat({ min: 0 }),
    body("restSeconds").optional().isInt({ min: 0 }),
    body("notes").optional().isString(),
    body("supersetGroup").optional().isInt(),
    body("machineSettings").optional().isObject(),
    validate,
  ],
  controller.addExercise
);

router.put(
  "/:id/exercises/:teId",
  [
    body("sortOrder").optional().isInt(),
    body("targetSets").optional().isInt({ min: 1 }),
    body("targetReps").optional().isInt({ min: 1 }),
    body("machineSettings").optional().isObject(),
    validate,
  ],
  controller.updateExercise
);

router.delete("/:id/exercises/:teId", controller.removeExercise);

router.post("/:id/duplicate", controller.duplicate);

module.exports = router;
