const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../../shared/middleware/authenticate");
const { validate } = require("../../shared/middleware/validate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.post(
  "/register",
  [body("token").trim().notEmpty(), body("platform").optional().isIn(["expo", "ios", "android"]), validate],
  controller.registerDevice
);

router.post(
  "/unregister",
  [body("token").trim().notEmpty(), validate],
  controller.unregisterDevice
);

router.get("/", controller.listDevices);

module.exports = router;
