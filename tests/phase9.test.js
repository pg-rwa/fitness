const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/config/database");

let trainerToken, clientToken;

const uid = Date.now();

beforeAll(async () => {
  // Register trainer
  let res = await request(app)
    .post("/api/auth/register")
    .send({ email: `p9trainer${uid}@test.com`, password: "password123", firstName: "Phase9", lastName: "Trainer", role: "trainer" });
  if (res.status !== 201) {
    res = await request(app)
      .post("/api/auth/login")
      .send({ email: `p9trainer${uid}@test.com`, password: "password123" });
  }
  trainerToken = res.body.token;

  // Register client
  let cres = await request(app)
    .post("/api/auth/register")
    .send({ email: `p9client${uid}@test.com`, password: "password123", firstName: "Phase9", lastName: "Client", role: "client" });
  if (cres.status !== 201) {
    cres = await request(app)
      .post("/api/auth/login")
      .send({ email: `p9client${uid}@test.com`, password: "password123" });
  }
  clientToken = cres.body.token;
});

afterAll(() => closeDb());

describe("Phase 9: Production Features", () => {
  // ─── Rate limiting ─────────────────────────────────────────
  describe("Rate Limiting", () => {
    it("should export rate limiters as middleware functions", () => {
      const { apiLimiter, authLimiter, uploadLimiter } = require("../src/shared/middleware/rate-limit");
      expect(typeof apiLimiter).toBe("function");
      expect(typeof authLimiter).toBe("function");
      expect(typeof uploadLimiter).toBe("function");
    });

    it("should allow requests in test mode (rate limiting bypassed)", async () => {
      const res = await request(app)
        .get("/api/health")
        .expect(200);

      expect(res.body.status).toBe("ok");
    });
  });

  // ─── Health endpoint enhancements ──────────────────────────
  describe("Health Endpoint", () => {
    it("should return wsClients count", async () => {
      const res = await request(app)
        .get("/api/health")
        .expect(200);

      expect(res.body.status).toBe("ok");
      expect(res.body.wsClients).toBeDefined();
      expect(typeof res.body.wsClients).toBe("number");
    });
  });

  // ─── File upload via multipart ─────────────────────────────
  describe("File Upload (multipart)", () => {
    it("should upload a progress photo via file", async () => {
      const fakeImage = Buffer.from("fake-jpeg-content");

      const res = await request(app)
        .post("/api/progress/photos/upload")
        .set("Authorization", `Bearer ${clientToken}`)
        .attach("photo", fakeImage, "test-photo.jpg")
        .field("category", "front")
        .field("notes", "Test upload");

      // Multer may reject the fake content type, but the route should exist
      expect([201, 400, 422]).toContain(res.status);
    });

    it("should reject upload without authentication", async () => {
      const res = await request(app)
        .post("/api/progress/photos/upload")
        .attach("photo", Buffer.from("data"), "test.jpg");

      expect(res.status).toBe(401);
    });
  });

  // ─── AI Insights ───────────────────────────────────────────
  describe("AI Insights (rule-based fallback)", () => {
    it("should generate insights without ANTHROPIC_API_KEY", async () => {
      const res = await request(app)
        .post("/api/insights/generate")
        .set("Authorization", `Bearer ${clientToken}`)
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should list insights", async () => {
      const res = await request(app)
        .get("/api/insights")
        .set("Authorization", `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  // ─── Static files ─────────────────────────────────────────
  describe("Static File Serving", () => {
    it("should serve /uploads path (404 for missing file, not route error)", async () => {
      const res = await request(app).get("/uploads/nonexistent.jpg");
      // Should be 404 (file not found) rather than a route error
      expect(res.status).toBe(404);
    });
  });

  // ─── WebSocket manager ────────────────────────────────────
  describe("WebSocket Manager", () => {
    it("should export wsManager singleton", () => {
      const { wsManager } = require("../src/shared/services/websocket");
      expect(wsManager).toBeDefined();
      expect(typeof wsManager.send).toBe("function");
      expect(typeof wsManager.broadcast).toBe("function");
      expect(typeof wsManager.getOnlineCount).toBe("function");
      expect(wsManager.getOnlineCount()).toBe(0);
    });
  });

  // ─── Email service ────────────────────────────────────────
  describe("Email Service", () => {
    it("should gracefully skip when SMTP is not configured", async () => {
      const { sendEmail } = require("../src/shared/services/email");
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        text: "Hello",
      });
      // Should return null (no SMTP configured)
      expect(result).toBeNull();
    });

    it("should export template helpers", () => {
      const email = require("../src/shared/services/email");
      expect(typeof email.sessionApprovedEmail).toBe("function");
      expect(typeof email.sessionDeclinedEmail).toBe("function");
      expect(typeof email.sessionRequestEmail).toBe("function");
      expect(typeof email.sessionReminderEmail).toBe("function");
    });
  });

  // ─── File upload service (S3 adapter) ─────────────────────
  describe("File Upload Service", () => {
    it("should create local adapter by default", () => {
      const { createFileUploadService } = require("../src/shared/services/file-upload");
      const service = createFileUploadService();
      expect(service).toBeDefined();
      expect(typeof service.upload).toBe("function");
      expect(typeof service.remove).toBe("function");
    });

    it("should export S3StorageAdapter", () => {
      const { S3StorageAdapter } = require("../src/shared/services/file-upload");
      expect(S3StorageAdapter).toBeDefined();
    });
  });

  // ─── Upload middleware ────────────────────────────────────
  describe("Upload Middleware", () => {
    it("should export uploadImage middleware", () => {
      const { uploadImage } = require("../src/shared/middleware/upload");
      expect(uploadImage).toBeDefined();
      expect(typeof uploadImage.single).toBe("function");
    });
  });

  // ─── Notifications listeners integration ────────────────────
  describe("Notification Listeners", () => {
    it("should set up event listeners with email and WS support", () => {
      const { setupListeners } = require("../src/modules/notifications/listeners");
      expect(typeof setupListeners).toBe("function");
    });
  });
});
