const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const goalController = require("../controllers/goals");

const router = Router();

router.use(authenticate);

router.get("/", goalController.list);

router.post(
  "/",
  [
    body("title").trim().notEmpty(),
    body("description").optional().isString(),
    body("targetDate").optional().isISO8601(),
    validate,
  ],
  goalController.create
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
  goalController.update
);

router.delete("/:id", goalController.remove);

module.exports = router;
