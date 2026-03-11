const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");
const { authLimiter } = require("../../shared/middleware/rate-limit");

const router = Router();

// ─── OTP Routes ──────────────────────────────────────────────
router.post(
  "/otp/send",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("type")
      .optional()
      .isIn(["registration", "invitation"])
      .withMessage("Type must be registration or invitation"),
    validate,
  ],
  controller.sendOTP
);

router.post(
  "/otp/verify",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("code").isLength({ min: 6, max: 6 }).withMessage("Code must be 6 digits"),
    body("type")
      .optional()
      .isIn(["registration", "invitation"])
      .withMessage("Type must be registration or invitation"),
    validate,
  ],
  controller.verifyOTP
);

// ─── Registration (requires email verification token) ────────
router.post(
  "/register",
  authLimiter,
  [
    body("verificationToken").notEmpty().withMessage("Email verification is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("role")
      .optional()
      .isIn(["trainer", "client"])
      .withMessage("Role must be trainer or client"),
    validate,
  ],
  controller.register
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty(), validate],
  controller.login
);

router.post(
  "/refresh",
  [body("refreshToken").notEmpty(), validate],
  controller.refresh
);

router.post(
  "/logout",
  [body("refreshToken").notEmpty(), validate],
  controller.logout
);

// ─── Invitation routes (trainers and admins can invite) ──────
router.post(
  "/invitations",
  authenticate,
  authorize("admin", "trainer"),
  [
    body("email").isEmail().normalizeEmail(),
    body("role")
      .optional()
      .isIn(["trainer", "client"])
      .withMessage("Role must be trainer or client"),
    validate,
  ],
  controller.createInvitation
);

router.get("/invitations", authenticate, authorize("admin", "trainer"), controller.listInvitations);

router.delete(
  "/invitations/:id",
  authenticate,
  authorize("admin", "trainer"),
  controller.revokeInvitation
);

// Accept invitation (requires OTP verification token)
router.post(
  "/invitations/accept",
  [
    body("verificationToken").notEmpty().withMessage("Email verification is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    validate,
  ],
  controller.acceptInvitation
);

// Token-based invitation flow (no OTP required)
router.get("/invitations/token/:token", controller.getInvitationByToken);

router.post(
  "/invitations/accept-token",
  [
    body("token").notEmpty().withMessage("Invitation token is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    validate,
  ],
  controller.acceptInvitationByToken
);

module.exports = router;
