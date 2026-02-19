const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/config/database");

afterAll(() => {
  closeDb();
});

describe("Auth API", () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Test",
    lastName: "User",
  };

  let authToken;

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it("should reject duplicate email", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.status).toBe(409);
    });

    it("should reject invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "invalid" });
      expect(res.status).toBe(400);
    });

    it("should reject short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "new@test.com", password: "short" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    it("should reject invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: "wrongpassword" });
      expect(res.status).toBe(401);
    });

    it("should reject unknown email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.com", password: "password123" });
      expect(res.status).toBe(401);
    });
  });

  describe("Protected routes", () => {
    it("should reject requests without token", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });

    it("should accept requests with valid token", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
    });

    it("should reject requests with invalid token", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalidtoken");
      expect(res.status).toBe(401);
    });
  });
});

describe("Health check", () => {
  it("should return ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
