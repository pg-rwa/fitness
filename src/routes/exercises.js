const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const exerciseController = require("../controllers/exercises");

const router = Router();

router.use(authenticate);

router.get("/", exerciseController.list);
router.get("/:id", exerciseController.getById);

module.exports = router;
