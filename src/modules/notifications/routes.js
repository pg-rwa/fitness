const { Router } = require("express");
const controller = require("./controller");
const { authenticate } = require("../../shared/middleware/authenticate");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.put("/:id/read", controller.markRead);
router.put("/read-all", controller.markAllRead);

module.exports = router;
