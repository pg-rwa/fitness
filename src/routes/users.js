const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const userController = require("../controllers/users");

const router = Router();

router.use(authenticate);

router.get("/me", userController.getProfile);

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
  userController.updateProfile
);

module.exports = router;
