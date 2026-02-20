const { Router } = require("express");
const { body, query } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");

const router = Router();
router.use(authenticate);

router.post(
  "/records",
  [
    body("records").isArray({ min: 1 }),
    body("records.*.source").optional().isIn(controller.VALID_SOURCES),
    body("records.*.metricType").isIn(controller.VALID_METRICS),
    body("records.*.value").isFloat(),
    body("records.*.unit").isString(),
    body("records.*.recordedAt").isISO8601(),
    validate,
  ],
  controller.batchUpload
);

router.get("/records", controller.queryRecords);

router.get(
  "/summary",
  [query("date").isISO8601(), validate],
  controller.dailySummary
);

module.exports = router;
