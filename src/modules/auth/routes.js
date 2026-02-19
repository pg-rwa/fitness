const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
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

// Invitation routes (trainers and admins can invite)
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

// Accept invitation (public - token in body)
router.post(
  "/invitations/accept",
  [
    body("token").notEmpty(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    validate,
  ],
  controller.acceptInvitation
);

module.exports = router;
