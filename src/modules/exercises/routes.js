const { Router } = require("express");
const { authenticate } = require("../../shared/middleware/authenticate");
const controller = require("./controller");

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);

module.exports = router;
