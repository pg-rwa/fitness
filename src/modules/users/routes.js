const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");
const { validate } = require("../../shared/middleware/validate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.get("/me", controller.getProfile);

router.put(
  "/me/profile",
  [
    body("heightCm").optional().isFloat({ min: 0 }),
    body("weightKg").optional().isFloat({ min: 0 }),
    body("dateOfBirth").optional().isISO8601(),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("fitnessLevel").optional().isIn(["beginner", "intermediate", "advanced"]),
    validate,
  ],
  controller.updateProfile
);

// ─── Trainer endpoints ──────────────────────────────────────

// Get trainer's client list
router.get("/my-clients", authorize("trainer", "admin"), controller.myClients);

// Search clients by email
router.get("/search-clients", authorize("trainer", "admin"), controller.searchClients);

// Trainer requests
router.post(
  "/trainer-requests",
  authorize("trainer", "admin"),
  [body("clientId").isInt(), validate],
  controller.sendTrainerRequest
);
router.get("/trainer-requests", authorize("trainer", "admin"), controller.listTrainerRequests);

// Client views pending requests from trainers
router.get("/client-requests", controller.listClientRequests);

// Client responds to trainer request
router.put(
  "/trainer-requests/:id/respond",
  [body("action").isIn(["approve", "decline"]), validate],
  controller.respondToRequest
);

// Trainer creates template for client
router.post(
  "/clients/:clientId/templates",
  authorize("trainer", "admin"),
  [
    body("name").trim().notEmpty(),
    body("description").optional().isString(),
    body("category").optional().isString(),
    body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]),
    body("estimatedDurationMin").optional().isInt({ min: 1 }),
    body("exercises").optional().isArray(),
    body("exercises.*.exerciseId").optional().isInt(),
    body("exercises.*.targetSets").optional().isInt({ min: 1 }),
    body("exercises.*.targetReps").optional().isInt({ min: 1 }),
    validate,
  ],
  controller.createTemplateForClient
);

module.exports = router;
