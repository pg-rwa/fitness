const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");
const { validate } = require("../../shared/middleware/validate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.get("/:id/video", controller.getVideoId);

router.post(
  "/",
  authorize("admin", "trainer"),
  [
    body("name").trim().notEmpty(),
    body("category").trim().notEmpty(),
    body("muscleGroup").trim().notEmpty(),
    body("description").optional().isString(),
    body("secondaryMuscles").optional().isArray(),
    body("equipmentId").optional().isInt(),
    body("equipment").optional().isString(),
    body("instructions").optional().isString(),
    body("videoUrl").optional().isString(),
    body("photoUrl").optional().isString(),
    validate,
  ],
  controller.create
);

router.put(
  "/:id",
  authorize("admin", "trainer"),
  [
    body("name").optional().trim().notEmpty(),
    body("category").optional().trim().notEmpty(),
    body("muscleGroup").optional().trim().notEmpty(),
    body("secondaryMuscles").optional().isArray(),
    validate,
  ],
  controller.update
);

router.delete("/:id", authorize("admin", "trainer"), controller.remove);

module.exports = router;
