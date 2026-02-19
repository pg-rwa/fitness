const { Router } = require("express");
const { body, param, query } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

// Definitions (admin/trainer only for create/update/delete)
router.get(
  "/definitions",
  [query("entityType").notEmpty(), validate],
  controller.listDefinitions
);

router.post(
  "/definitions",
  authorize("admin", "trainer"),
  [
    body("entityType").trim().notEmpty(),
    body("name").trim().notEmpty(),
    body("fieldType").isIn(["text", "number", "date", "boolean", "select", "multiselect", "json"]),
    body("options").optional().isObject(),
    validate,
  ],
  controller.createDefinition
);

router.put(
  "/definitions/:id",
  authorize("admin", "trainer"),
  [
    param("id").isInt(),
    body("name").optional().trim().notEmpty(),
    body("fieldType").optional().isIn(["text", "number", "date", "boolean", "select", "multiselect", "json"]),
    body("options").optional().isObject(),
    body("isActive").optional().isBoolean(),
    validate,
  ],
  controller.updateDefinition
);

router.delete("/definitions/:id", authorize("admin", "trainer"), controller.removeDefinition);

// Values
router.get(
  "/values/:entityType/:entityId",
  [param("entityType").notEmpty(), param("entityId").isInt(), validate],
  controller.getValues
);

router.put(
  "/values/:entityType/:entityId",
  [
    param("entityType").notEmpty(),
    param("entityId").isInt(),
    body("fields").isArray({ min: 1 }),
    body("fields.*.fieldDefId").isInt(),
    body("fields.*.value").exists(),
    validate,
  ],
  controller.setValues
);

module.exports = router;
