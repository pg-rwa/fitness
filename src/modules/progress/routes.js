const { Router } = require("express");
const { body, query } = require("express-validator");
const controller = require("./controller");
const { validate } = require("../../shared/middleware/validate");
const { authenticate } = require("../../shared/middleware/authenticate");
const { authorize } = require("../../shared/middleware/authorize");
const { uploadImage } = require("../../shared/middleware/upload");
const { uploadLimiter } = require("../../shared/middleware/rate-limit");

const router = Router();
router.use(authenticate);

// ─── Measurements ────────────────────────────────────────────

router.post(
  "/measurements",
  [
    body("weightKg").optional().isFloat({ min: 0 }),
    body("bodyFatPct").optional().isFloat({ min: 0, max: 100 }),
    body("chestCm").optional().isFloat({ min: 0 }),
    body("waistCm").optional().isFloat({ min: 0 }),
    body("hipsCm").optional().isFloat({ min: 0 }),
    body("bicepLeftCm").optional().isFloat({ min: 0 }),
    body("bicepRightCm").optional().isFloat({ min: 0 }),
    body("thighLeftCm").optional().isFloat({ min: 0 }),
    body("thighRightCm").optional().isFloat({ min: 0 }),
    body("neckCm").optional().isFloat({ min: 0 }),
    body("notes").optional().isString(),
    body("recordedAt").optional().isISO8601(),
    validate,
  ],
  controller.recordMeasurement
);

router.get("/measurements", controller.listMeasurements);
router.get("/measurements/latest", controller.latestMeasurement);
router.get("/measurements/trends", controller.measurementTrends);

// Trainer views client measurements
router.get("/measurements/client/:clientId", authorize("admin", "trainer"), controller.listMeasurements);
router.get("/measurements/client/:clientId/trends", authorize("admin", "trainer"), controller.measurementTrends);

// ─── Progress Photos ─────────────────────────────────────────

router.post(
  "/photos",
  [
    body("photoUrl").trim().notEmpty(),
    body("thumbnailUrl").optional().isString(),
    body("category").optional().isIn(["front", "side", "back", "flexed", "custom"]),
    body("notes").optional().isString(),
    body("takenAt").optional().isISO8601(),
    validate,
  ],
  controller.uploadPhoto
);

// File-based photo upload (multipart/form-data)
router.post(
  "/photos/upload",
  uploadLimiter,
  uploadImage.single("photo"),
  controller.uploadPhotoFile
);

router.get("/photos", controller.listPhotos);
router.get("/photos/compare", controller.comparePhotos);
router.delete("/photos/:id", controller.deletePhoto);

// Trainer views client photos
router.get("/photos/client/:clientId", authorize("admin", "trainer"), controller.listPhotos);

module.exports = router;
