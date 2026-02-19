const request = require("supertest");
const app = require("../src/app");
const { getDb, closeDb } = require("../src/config/database");

let adminToken;
let trainerToken;
let clientToken;
let clientUserId;

beforeAll(async () => {
  // Create an admin user directly in DB
  const adminRes = await request(app).post("/api/auth/register").send({
    email: `admin-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Admin",
    lastName: "User",
  });
  // Promote to admin directly
  const db = getDb();
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(adminRes.body.user.id);
  // Login to get token with admin role
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: adminRes.body.user.email, password: "password123" });
  adminToken = loginRes.body.token;

  const trainerRes = await request(app).post("/api/auth/register").send({
    email: `admin-test-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Admin",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;

  const clientRes = await request(app).post("/api/auth/register").send({
    email: `admin-test-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Admin",
    lastName: "Client",
  });
  clientToken = clientRes.body.token;
  clientUserId = clientRes.body.user.id;
});

afterAll(() => {
  closeDb();
});

describe("Admin API", () => {
  describe("Feature Flags", () => {
    it("should list feature flags", async () => {
      const res = await request(app)
        .get("/api/admin/features")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.auth).toBe(true);
      expect(res.body.workouts).toBe(true);
    });

    it("should toggle a feature flag", async () => {
      const res = await request(app)
        .put("/api/admin/features/nutrition")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ enabled: true });
      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
    });

    it("should reject non-admin accessing features", async () => {
      const res = await request(app)
        .get("/api/admin/features")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it("should reject trainer accessing admin features", async () => {
      const res = await request(app)
        .get("/api/admin/features")
        .set("Authorization", `Bearer ${trainerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("User Management", () => {
    it("should list all users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=trainer")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      for (const user of res.body.data) {
        expect(user.role).toBe("trainer");
      }
    });

    it("should update user role", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${clientUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "trainer" });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("trainer");

      // Reset back
      await request(app)
        .put(`/api/admin/users/${clientUserId}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "client" });
    });

    it("should update user status", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${clientUserId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "suspended" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("suspended");

      // Reset back
      await request(app)
        .put(`/api/admin/users/${clientUserId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "active" });
    });

    it("should reject non-admin managing users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });
  });
});
