const { Router } = require("express");
const { body, query } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

// Availability
router.get("/availability", controller.getAvailability);
router.get("/availability/:trainerId", controller.getAvailability);
router.put(
  "/availability",
  authorize("admin", "trainer"),
  [
    body("slots").isArray({ min: 1 }),
    body("slots.*.dayOfWeek").isInt({ min: 0, max: 6 }),
    body("slots.*.startTime").matches(/^\d{2}:\d{2}$/),
    body("slots.*.endTime").matches(/^\d{2}:\d{2}$/),
    validate,
  ],
  controller.setAvailability
);

// Sessions
router.get("/sessions", controller.listSessions);
router.get("/sessions/available-slots", controller.getAvailableSlots);

router.post(
  "/sessions",
  [
    body("trainerId").optional().isInt(),
    body("clientId").optional().isInt(),
    body("title").trim().notEmpty(),
    body("scheduledStart").isISO8601(),
    body("scheduledEnd").isISO8601(),
    body("templateId").optional().isInt(),
    body("location").optional().isString(),
    body("notes").optional().isString(),
    validate,
  ],
  controller.createSession
);

router.put("/sessions/:id/approve", authorize("admin", "trainer"), controller.approveSession);
router.put(
  "/sessions/:id/decline",
  authorize("admin", "trainer"),
  [body("reason").optional().isString(), validate],
  controller.declineSession
);
router.put("/sessions/:id/cancel", controller.cancelSession);
router.put("/sessions/:id/complete", authorize("admin", "trainer"), controller.completeSession);

module.exports = router;
