const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { validate } = require("../../shared/middleware/validate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.get("/", controller.list);

router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("description").optional().isString(),
    body("targetDate").optional().isISO8601(),
    validate,
  ],
  controller.create
);

router.put(
  "/:id",
  [
    body("title").optional().trim().notEmpty(),
    body("description").optional().isString(),
    body("targetDate").optional().isISO8601(),
    body("status").optional().isIn(["active", "completed", "abandoned"]),
    validate,
  ],
  controller.update
);

router.delete("/:id", controller.remove);

module.exports = router;
