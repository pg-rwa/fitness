const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);

router.post(
  "/",
  authorize("admin", "trainer"),
  [
    body("name").trim().notEmpty(),
    body("category")
      .optional()
      .isIn(["machine", "free_weight", "cable", "bodyweight", "cardio", "other"]),
    body("brand").optional().isString(),
    body("model").optional().isString(),
    body("defaultSettings").optional().isObject(),
    body("gymLocation").optional().isString(),
    body("notes").optional().isString(),
    validate,
  ],
  controller.create
);

router.put(
  "/:id",
  authorize("admin", "trainer"),
  [
    body("name").optional().trim().notEmpty(),
    body("category")
      .optional()
      .isIn(["machine", "free_weight", "cable", "bodyweight", "cardio", "other"]),
    body("defaultSettings").optional().isObject(),
    validate,
  ],
  controller.update
);

router.delete("/:id", authorize("admin", "trainer"), controller.remove);

module.exports = router;
