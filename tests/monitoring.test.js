const request = require("supertest");
const app = require("../src/app");
const { getDb } = require("../src/config/database");
const { metrics, Metrics } = require("../src/shared/services/metrics");
const { logger, LOG_LEVELS } = require("../src/shared/services/logger");
const { registerTestUser } = require("./helpers");

let adminToken;
let userToken;

beforeAll(async () => {
  // Create admin via register + promote
  const adminRes = await registerTestUser(app, {
    email: `metrics-admin-${Date.now()}@test.com`,
    password: "admin123",
    firstName: "Metrics",
    lastName: "Admin",
  });
  const db = getDb();
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(
    adminRes.body.user.id
  );
  const loginRes = await request(app).post("/api/auth/login").send({
    email: adminRes.body.user.email,
    password: "admin123",
  });
  adminToken = loginRes.body.token;

  // Create regular user
  const userRes = await registerTestUser(app, {
    email: `metrics-user-${Date.now()}@test.com`,
    password: "password123",
    firstName: "Metrics",
    lastName: "User",
  });
  userToken = userRes.body.token;
});

describe("Structured Logger", () => {
  test("logger has all level methods", () => {
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  test("child logger inherits context", () => {
    const child = logger.child({ service: "test" });
    expect(typeof child.info).toBe("function");
    expect(typeof child.error).toBe("function");
  });

  test("child logger can create nested children", () => {
    const child = logger.child({ service: "test" });
    const grandchild = child.child({ requestId: "abc" });
    expect(typeof grandchild.info).toBe("function");
  });

  test("LOG_LEVELS are defined correctly", () => {
    expect(LOG_LEVELS.error).toBe(0);
    expect(LOG_LEVELS.warn).toBe(1);
    expect(LOG_LEVELS.info).toBe(2);
    expect(LOG_LEVELS.debug).toBe(3);
  });
});

describe("Metrics Collector", () => {
  let testMetrics;

  beforeEach(() => {
    testMetrics = new Metrics();
  });

  test("records requests and produces snapshot", () => {
    testMetrics.recordRequest("GET", "/api/health", 200, 15);
    testMetrics.recordRequest("POST", "/api/auth/login", 200, 45);
    testMetrics.recordRequest("GET", "/api/workouts", 401, 5);

    const snap = testMetrics.snapshot();
    expect(snap.requests.total).toBe(3);
    expect(snap.requests.errors).toBe(1);
    expect(snap.statusCodes["2xx"]).toBe(2);
    expect(snap.statusCodes["4xx"]).toBe(1);
  });

  test("normalises paths with numeric IDs", () => {
    testMetrics.recordRequest("GET", "/api/workouts/123", 200, 10);
    testMetrics.recordRequest("GET", "/api/workouts/456", 200, 12);

    const snap = testMetrics.snapshot();
    const route = snap.topRoutes.find((r) => r.route === "GET /api/workouts/:id");
    expect(route).toBeDefined();
    expect(route.count).toBe(2);
  });

  test("normalises paths with UUIDs", () => {
    testMetrics.recordRequest(
      "GET",
      "/api/workouts/550e8400-e29b-41d4-a716-446655440000",
      200,
      10
    );
    const snap = testMetrics.snapshot();
    const route = snap.topRoutes.find((r) => r.route === "GET /api/workouts/:id");
    expect(route).toBeDefined();
  });

  test("latency histogram populates correctly", () => {
    testMetrics.recordRequest("GET", "/api/health", 200, 3);   // <=5ms
    testMetrics.recordRequest("GET", "/api/health", 200, 150); // <=250ms
    testMetrics.recordRequest("GET", "/api/health", 200, 6000); // >5000ms

    const snap = testMetrics.snapshot();
    expect(snap.latency.histogram["<=5ms"]).toBe(1);
    expect(snap.latency.histogram["<=250ms"]).toBe(1);
    expect(snap.latency.histogram[">5000ms"]).toBe(1);
  });

  test("records errors with details", () => {
    const error = new Error("Test error");
    error.code = "TEST_ERROR";
    error.status = 500;

    testMetrics.recordError(error, { method: "GET", originalUrl: "/api/test" });

    const snap = testMetrics.snapshot();
    expect(snap.errors.byCode.TEST_ERROR).toBe(1);
    expect(snap.errors.recent).toHaveLength(1);
    expect(snap.errors.recent[0].message).toBe("Test error");
  });

  test("recent errors capped at 50", () => {
    for (let i = 0; i < 60; i++) {
      testMetrics.recordError(new Error(`Error ${i}`), {
        method: "GET",
        originalUrl: "/api/test",
      });
    }
    expect(testMetrics.recentErrors).toHaveLength(50);
  });

  test("tracks active requests", () => {
    testMetrics.trackActive(1);
    testMetrics.trackActive(1);
    expect(testMetrics.activeRequests).toBe(2);
    expect(testMetrics.peakActiveRequests).toBe(2);

    testMetrics.trackActive(-1);
    expect(testMetrics.activeRequests).toBe(1);
    expect(testMetrics.peakActiveRequests).toBe(2); // peak unchanged
  });

  test("snapshot includes system info", () => {
    const snap = testMetrics.snapshot();
    expect(snap.system.memory.rss).toBeGreaterThan(0);
    expect(snap.system.memory.heapUsed).toBeGreaterThan(0);
    expect(snap.system.nodeVersion).toMatch(/^v\d+/);
  });
});

describe("Request Logging Middleware", () => {
  test("health endpoint returns X-Request-Id header", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-request-id"].length).toBeGreaterThan(0);
  });

  test("forwards incoming X-Request-Id", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("X-Request-Id", "test-correlation-123");
    expect(res.headers["x-request-id"]).toBe("test-correlation-123");
  });
});

describe("GET /api/admin/metrics", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/admin/metrics");
    expect(res.status).toBe(401);
  });

  test("requires admin role", async () => {
    const res = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test("returns metrics snapshot for admin", async () => {
    const res = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.requests).toBeDefined();
    expect(res.body.requests.total).toBeGreaterThan(0);
    expect(res.body.statusCodes).toBeDefined();
    expect(res.body.latency).toBeDefined();
    expect(res.body.latency.histogram).toBeDefined();
    expect(res.body.topRoutes).toBeInstanceOf(Array);
    expect(res.body.errors).toBeDefined();
    expect(res.body.system).toBeDefined();
    expect(res.body.system.memory.rss).toBeGreaterThan(0);
    expect(res.body.websocket).toBeDefined();
  });
});
