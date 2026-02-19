const { Router } = require("express");
const { body, param } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();

router.use(authenticate);
router.use(authorize("admin"));

// Feature flags
router.get("/features", controller.listFeatures);

router.put(
  "/features/:name",
  [body("enabled").isBoolean(), validate],
  controller.toggleFeature
);

// User management
router.get("/users", controller.listUsers);

router.put(
  "/users/:id/role",
  [param("id").isInt(), body("role").isIn(["admin", "trainer", "client"]), validate],
  controller.updateUserRole
);

router.put(
  "/users/:id/status",
  [param("id").isInt(), body("status").isIn(["active", "suspended", "inactive"]), validate],
  controller.updateUserStatus
);

module.exports = router;
