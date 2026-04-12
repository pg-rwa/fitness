const { Router } = require("express");
const controller = require("./controller");
const { authenticate } = require("../../shared/middleware/authenticate");

const router = Router();
router.use(authenticate);

router.post("/command", controller.processCommand);
router.get("/context", controller.getWorkoutContext);
router.get("/history", controller.getHistory);
router.get("/mood", controller.getMood);

module.exports = router;
