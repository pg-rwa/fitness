const { Router } = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const { validate } = require("../middleware/validate");

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    validate,
  ],
  authController.register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    validate,
  ],
  authController.login
);

module.exports = router;
