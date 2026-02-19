const { Router } = require("express");
const { query } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");

const router = Router();
router.use(authenticate);

router.get(
  "/",
  [
    query("start").isISO8601(),
    query("end").isISO8601(),
    validate,
  ],
  controller.getEvents
);

module.exports = router;
