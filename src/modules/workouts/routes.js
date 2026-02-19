const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { validate } = require("../../shared/middleware/validate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);

router.post(
  "/",
  [body("name").trim().notEmpty(), body("notes").optional().isString(), validate],
  controller.create
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
  controller.addExercise
);

router.put("/:id/complete", controller.complete);

module.exports = router;
