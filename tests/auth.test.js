const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/config/database");
const { registerTestUser } = require("./helpers");

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

  describe("POST /api/auth/register (with OTP)", () => {
    it("should register a new user via OTP flow", async () => {
      const res = await registerTestUser(app, testUser);
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it("should reject duplicate email", async () => {
      const res = await registerTestUser(app, testUser);
      expect(res.status).toBe(409);
    });

    it("should reject registration without verification token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "new@test.com" });
      expect(res.status).toBe(400);
    });

    it("should reject short password", async () => {
      // Send OTP + verify for a new email, then try short password
      const email = `short-${Date.now()}@test.com`;
      await request(app).post("/api/auth/otp/send").send({ email, type: "registration" });
      const verifyRes = await request(app).post("/api/auth/otp/verify").send({ email, code: "123456", type: "registration" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ verificationToken: verifyRes.body.verificationToken, password: "short", firstName: "X", lastName: "Y" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/otp", () => {
    it("should send OTP to an email", async () => {
      const res = await request(app)
        .post("/api/auth/otp/send")
        .send({ email: `otp-test-${Date.now()}@example.com`, type: "registration" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Verification code sent");
    });

    it("should reject invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/otp/send")
        .send({ email: "invalid", type: "registration" });
      expect(res.status).toBe(400);
    });

    it("should verify correct OTP code", async () => {
      const email = `verify-${Date.now()}@example.com`;
      await request(app).post("/api/auth/otp/send").send({ email, type: "registration" });

      const res = await request(app)
        .post("/api/auth/otp/verify")
        .send({ email, code: "123456", type: "registration" });
      expect(res.status).toBe(200);
      expect(res.body.verificationToken).toBeDefined();
    });

    it("should reject wrong OTP code", async () => {
      const email = `wrong-${Date.now()}@example.com`;
      await request(app).post("/api/auth/otp/send").send({ email, type: "registration" });

      const res = await request(app)
        .post("/api/auth/otp/verify")
        .send({ email, code: "000000", type: "registration" });
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
