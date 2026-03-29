const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");
const { validate } = require("../../shared/middleware/validate");
const { uploadImage } = require("../../shared/middleware/upload");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.get("/me", controller.getProfile);

router.put(
  "/me/profile",
  [
    body("firstName").optional().trim().isLength({ min: 1, max: 100 }),
    body("lastName").optional().trim().isLength({ min: 1, max: 100 }),
    body("phone").optional({ values: "falsy" }).trim().isLength({ max: 20 }),
    body("bio").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
    body("address").optional({ values: "falsy" }).trim().isLength({ max: 300 }),
    body("timezone").optional({ values: "falsy" }).trim(),
    body("heightCm").optional().isFloat({ min: 0 }),
    body("weightKg").optional().isFloat({ min: 0 }),
    body("dateOfBirth").optional().isISO8601(),
    body("gender").optional().isIn(["male", "female", "other", ""]),
    body("fitnessLevel").optional().isIn(["beginner", "intermediate", "advanced", ""]),
    validate,
  ],
  controller.updateProfile
);

// Avatar upload & delete
router.post("/me/avatar", uploadImage.single("avatar"), controller.uploadAvatar);
router.delete("/me/avatar", controller.deleteAvatar);

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

// Get user by ID (trainers see own clients, admins see anyone)
router.get("/:id", authorize("trainer", "admin"), controller.getUserById);

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
