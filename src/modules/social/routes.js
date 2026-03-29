const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { validate } = require("../../shared/middleware/validate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

// Leaderboard
router.get("/leaderboard", controller.leaderboard);

// Challenges
router.get("/challenges", controller.listChallenges);

router.post(
  "/challenges",
  [
    body("title").trim().notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("type").optional().isIn(["workout_count", "total_volume", "workout_days", "calories_burned"]),
    body("targetValue").optional().isFloat({ min: 1 }),
    body("unit").optional().isString(),
    body("description").optional().isString(),
    body("isPublic").optional().isBoolean(),
    validate,
  ],
  controller.createChallenge
);

router.get("/challenges/:id", controller.getChallenge);
router.post("/challenges/:id/join", controller.joinChallenge);
router.delete("/challenges/:id/leave", controller.leaveChallenge);

router.post(
  "/challenges/:id/progress",
  [body("value").optional().isFloat({ min: 0 }), validate],
  controller.updateProgress
);

module.exports = router;
