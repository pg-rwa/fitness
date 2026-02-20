const multer = require("multer");
const path = require("path");
const { ValidationError } = require("../utils/errors");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

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
