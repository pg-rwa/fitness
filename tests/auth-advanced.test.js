const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/config/database");

afterAll(() => {
  closeDb();
});

describe("Refresh Tokens", () => {
  const testUser = {
    email: `refresh-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Refresh",
    lastName: "Tester",
  };

  let refreshToken;

  it("should return a refresh token on register", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    refreshToken = res.body.refreshToken;
  });

  it("should return a refresh token on login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).toBeDefined();
  });

  it("should issue new tokens via refresh endpoint", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // New refresh token should be different (rotation)
    expect(res.body.refreshToken).not.toBe(refreshToken);
    refreshToken = res.body.refreshToken;
  });

  it("should reject a used (rotated) refresh token", async () => {
    // Use the current refreshToken
    const res1 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });
    expect(res1.status).toBe(200);

    // Old token should now be revoked
    const res2 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });
    expect(res2.status).toBe(401);
  });

  it("should reject invalid refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" });
    expect(res.status).toBe(401);
  });

  it("should logout by revoking refresh token", async () => {
    // Get a fresh token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    const rt = loginRes.body.refreshToken;

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: rt });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out");

    // Should no longer be able to refresh
    const res2 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: rt });
    expect(res2.status).toBe(401);
  });
});

describe("Invitations", () => {
  let trainerToken;
  let clientToken;
  let invitationToken;
  let invitationId;

  beforeAll(async () => {
    // Register a trainer
    const trainerRes = await request(app).post("/api/auth/register").send({
      email: `trainer-inv-${Date.now()}@example.com`,
      password: "password123",
      firstName: "Trainer",
      lastName: "Invite",
      role: "trainer",
    });
    trainerToken = trainerRes.body.token;

    // Register a regular client
    const clientRes = await request(app).post("/api/auth/register").send({
      email: `client-inv-${Date.now()}@example.com`,
      password: "password123",
      firstName: "Client",
      lastName: "Regular",
    });
    clientToken = clientRes.body.token;
  });

  it("should allow trainer to create invitation", async () => {
    const res = await request(app)
      .post("/api/auth/invitations")
      .set("Authorization", `Bearer ${trainerToken}`)
      .send({ email: `invited-${Date.now()}@example.com`, role: "client" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.status).toBe("pending");
    invitationToken = res.body.token;
    invitationId = res.body.id;
  });

  it("should reject client creating invitation", async () => {
    const res = await request(app)
      .post("/api/auth/invitations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ email: "someone@example.com", role: "client" });
    expect(res.status).toBe(403);
  });

  it("should list trainer invitations", async () => {
    const res = await request(app)
      .get("/api/auth/invitations")
      .set("Authorization", `Bearer ${trainerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should accept invitation with valid token", async () => {
    const res = await request(app)
      .post("/api/auth/invitations/accept")
      .send({
        token: invitationToken,
        password: "password123",
        firstName: "Invited",
        lastName: "User",
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("client");
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("should reject accepting already-used invitation", async () => {
    const res = await request(app)
      .post("/api/auth/invitations/accept")
      .send({
        token: invitationToken,
        password: "password123",
        firstName: "Duplicate",
        lastName: "User",
      });
    expect(res.status).toBe(404);
  });

  it("should allow trainer to revoke a pending invitation", async () => {
    const createRes = await request(app)
      .post("/api/auth/invitations")
      .set("Authorization", `Bearer ${trainerToken}`)
      .send({ email: `revoke-${Date.now()}@example.com`, role: "client" });
    expect(createRes.status).toBe(201);

    const res = await request(app)
      .delete(`/api/auth/invitations/${createRes.body.id}`)
      .set("Authorization", `Bearer ${trainerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("revoked");
  });
});

describe("Role-based registration", () => {
  it("should register as trainer", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: `role-trainer-${Date.now()}@example.com`,
      password: "password123",
      firstName: "Role",
      lastName: "Trainer",
      role: "trainer",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("trainer");
  });

  it("should default to client role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: `role-client-${Date.now()}@example.com`,
      password: "password123",
      firstName: "Role",
      lastName: "Client",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("client");
  });

  it("should reject invalid role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: `role-bad-${Date.now()}@example.com`,
      password: "password123",
      firstName: "Role",
      lastName: "Bad",
      role: "superadmin",
    });
    expect(res.status).toBe(400);
  });
});
