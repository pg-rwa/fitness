const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { getDb } = require("../../config/database");

const THUMB_WIDTH = 400;
const THUMB_HEIGHT = 400;

class LocalStorageAdapter {
  constructor(uploadDir) {
    this.uploadDir = uploadDir || path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(buffer, filename) {
    const ext = path.extname(filename);
    const uniqueName = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    await fsp.writeFile(filePath, buffer);
    return `/uploads/${uniqueName}`;
  }

  async saveThumbnail(buffer, filename) {
    const thumbDir = path.join(this.uploadDir, "thumbs");
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    const ext = path.extname(filename);
    const uniqueName = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filePath = path.join(thumbDir, uniqueName);
    await fsp.writeFile(filePath, buffer);
    return `/uploads/thumbs/${uniqueName}`;
  }

  async remove(url) {
    const filename = path.basename(url);
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fsp.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}

class S3StorageAdapter {
  constructor(config) {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

    this.bucket = config.bucket;
    this.prefix = config.prefix || "uploads";

    const clientConfig = { region: config.region || "us-east-1" };

    // Support DigitalOcean Spaces / MinIO / custom S3-compatible endpoints
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
      clientConfig.forcePathStyle = true;
    }

    if (config.accessKey && config.secretKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      };
    }

    this.s3 = new S3Client(clientConfig);
    this.PutObjectCommand = PutObjectCommand;
    this.DeleteObjectCommand = DeleteObjectCommand;
  }

  async save(buffer, filename) {
    const ext = path.extname(filename);
    const key = `${this.prefix}/${crypto.randomBytes(16).toString("hex")}${ext}`;

    await this.s3.send(
      new this.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ACL: "public-read",
      })
    );

    if (this.s3.config.endpoint) {
      const endpoint = this.s3.config.endpoint;
      const resolved = typeof endpoint === "function" ? await endpoint() : endpoint;
      const host = resolved.hostname || resolved;
      return `https://${this.bucket}.${host}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async saveThumbnail(buffer, filename) {
    const ext = path.extname(filename);
    const key = `${this.prefix}/thumbs/${crypto.randomBytes(16).toString("hex")}${ext}`;

    await this.s3.send(
      new this.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ACL: "public-read",
        ContentType: "image/jpeg",
      })
    );

    if (this.s3.config.endpoint) {
      const endpoint = this.s3.config.endpoint;
      const resolved = typeof endpoint === "function" ? await endpoint() : endpoint;
      const host = resolved.hostname || resolved;
      return `https://${this.bucket}.${host}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async remove(url) {
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;

    try {
      await this.s3.send(
        new this.DeleteObjectCommand({ Bucket: this.bucket, Key: key })
      );
    } catch (err) {
      console.error("[s3-delete-error]", err.message);
    }
  }
}

class FileUploadService {
  constructor(adapter) {
    this.adapter = adapter || new LocalStorageAdapter();
  }

  async upload({ userId, buffer, originalName, mimeType, entityType, entityId }) {
    const url = await this.adapter.save(buffer, originalName);
    const sizeBytes = buffer.length;

    // Generate thumbnail for image uploads
    let thumbnailUrl = null;
    if (mimeType && mimeType.startsWith("image/")) {
      try {
        const thumbBuffer = await sharp(buffer)
          .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover", position: "centre" })
          .jpeg({ quality: 80 })
          .toBuffer();
        const thumbName = path.basename(originalName, path.extname(originalName)) + ".jpg";
        thumbnailUrl = await this.adapter.saveThumbnail(thumbBuffer, thumbName);
      } catch (err) {
        console.error("[thumbnail-generation-error]", err.message);
      }
    }

    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO file_uploads (user_id, entity_type, entity_id, url, thumbnail_url, original_name, mime_type, size_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(userId, entityType || null, entityId || null, url, thumbnailUrl, originalName, mimeType, sizeBytes);

    return db.prepare("SELECT * FROM file_uploads WHERE id = ?").get(result.lastInsertRowid);
  }

  async remove(id, userId) {
    const db = getDb();
    const file = db
      .prepare("SELECT * FROM file_uploads WHERE id = ? AND user_id = ?")
      .get(id, userId);

    if (!file) return null;

    await this.adapter.remove(file.url);
    db.prepare("DELETE FROM file_uploads WHERE id = ?").run(id);
    return file;
  }

  getByEntity(entityType, entityId) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM file_uploads WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC")
      .all(entityType, entityId);
  }

  getByUser(userId) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM file_uploads WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId);
  }
}

function createFileUploadService() {
  const storageType = process.env.STORAGE_TYPE || "local";
  if (storageType === "s3") {
    const adapter = new S3StorageAdapter({
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT || null,
      accessKey: process.env.S3_ACCESS_KEY || null,
      secretKey: process.env.S3_SECRET_KEY || null,
      prefix: process.env.S3_PREFIX || "uploads",
    });
    return new FileUploadService(adapter);
  }
  return new FileUploadService(new LocalStorageAdapter());
}

module.exports = { FileUploadService, LocalStorageAdapter, S3StorageAdapter, createFileUploadService };
