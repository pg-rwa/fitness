const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

// Client views their own assignments
router.get("/mine", controller.listForClient);

// Trainer views client's assignments
router.get("/client/:clientId", authorize("admin", "trainer"), controller.listForClient);

// Trainer assigns workout to client
router.post(
  "/client/:clientId",
  authorize("admin", "trainer"),
  [
    body("templateId").isInt(),
    body("dayOfWeek").optional().isInt({ min: 0, max: 6 }),
    body("notes").optional().isString(),
    validate,
  ],
  controller.assign
);

// Trainer unassigns
router.delete("/:id", authorize("admin", "trainer"), controller.unassign);

module.exports = router;
