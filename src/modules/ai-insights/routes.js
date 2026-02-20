const { Router } = require("express");
const controller = require("./controller");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.get("/client/:clientId", authorize("admin", "trainer"), controller.list);
router.put("/:id/read", controller.markRead);
router.post("/generate", controller.generateInsights);
router.post("/generate/:clientId", authorize("admin", "trainer"), controller.generateInsights);

module.exports = router;
