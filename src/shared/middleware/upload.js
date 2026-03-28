const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { ValidationError } = require("../utils/errors");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Use disk storage instead of memory to avoid holding large files in RAM
const uploadDir = path.join(__dirname, "../../../uploads/tmp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

const imageFilter = (_req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new ValidationError("Only JPEG, PNG, WebP, and HEIC images are allowed"));
  }
  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { uploadImage, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE };
