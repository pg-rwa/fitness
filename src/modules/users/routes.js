const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
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

module.exports = router;
