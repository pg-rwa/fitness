const request = require("supertest");
const app = require("../src/app");
const { getDb, closeDb } = require("../src/config/database");

let trainerToken;
let trainerUserId;
let clientToken;
let clientUserId;

beforeAll(async () => {
  const trainerRes = await request(app).post("/api/auth/register").send({
    email: `p6-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P6",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;
  trainerUserId = trainerRes.body.user.id;

  const clientRes = await request(app).post("/api/auth/register").send({
    email: `p6-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P6",
    lastName: "Client",
  });
  clientToken = clientRes.body.token;
  clientUserId = clientRes.body.user.id;

  const db = getDb();
  db.prepare("UPDATE users SET trainer_id = ? WHERE id = ?").run(trainerUserId, clientUserId);
});

afterAll(() => {
  closeDb();
});

function clientAuth() {
  return { Authorization: `Bearer ${clientToken}` };
}
function trainerAuth() {
  return { Authorization: `Bearer ${trainerToken}` };
}

// ─── Health Sync ─────────────────────────────────────────────

describe("Health Sync API", () => {
  it("should batch upload health records", async () => {
    const res = await request(app)
      .post("/api/health-sync/records")
      .set(clientAuth())
      .send({
        records: [
          { source: "apple_health", metricType: "steps", value: 8500, unit: "steps", recordedAt: "2026-02-20T08:00:00Z" },
          { source: "apple_health", metricType: "heart_rate", value: 72, unit: "bpm", recordedAt: "2026-02-20T08:00:00Z" },
          { source: "apple_health", metricType: "heart_rate", value: 68, unit: "bpm", recordedAt: "2026-02-20T12:00:00Z" },
          { source: "apple_health", metricType: "sleep_hours", value: 7.5, unit: "hours", recordedAt: "2026-02-20T06:00:00Z" },
          { source: "apple_health", metricType: "calories_burned", value: 420, unit: "kcal", recordedAt: "2026-02-20T18:00:00Z" },
          { source: "apple_health", metricType: "active_minutes", value: 45, unit: "min", recordedAt: "2026-02-20T18:00:00Z" },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.inserted).toBe(6);
  });

  it("should query records by metric", async () => {
    const res = await request(app)
      .get("/api/health-sync/records?metric=heart_rate")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    for (const r of res.body.data) {
      expect(r.metric_type).toBe("heart_rate");
    }
  });

  it("should query records by date range", async () => {
    const res = await request(app)
      .get("/api/health-sync/records?start=2026-02-20T00:00:00Z&end=2026-02-20T23:59:59Z")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(6);
  });

  it("should query records by source", async () => {
    const res = await request(app)
      .get("/api/health-sync/records?source=apple_health")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(6);
  });

  it("should get daily health summary", async () => {
    const res = await request(app)
      .get("/api/health-sync/summary?date=2026-02-20")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.date).toBe("2026-02-20");
    expect(res.body.summary.steps.value).toBe(8500);
    expect(res.body.summary.heart_rate.value).toBe(70); // avg of 72 and 68
    expect(res.body.summary.sleep_hours.value).toBe(7.5);
    expect(res.body.summary.calories_burned.value).toBe(420);
    expect(res.body.summary.active_minutes.value).toBe(45);
  });

  it("should reject invalid metric type", async () => {
    const res = await request(app)
      .post("/api/health-sync/records")
      .set(clientAuth())
      .send({
        records: [{ metricType: "invalid_metric", value: 100, unit: "x", recordedAt: "2026-02-20T00:00:00Z" }],
      });
    expect(res.status).toBe(400);
  });
});

// ─── AI Insights ─────────────────────────────────────────────

describe("AI Insights API", () => {
  beforeAll(async () => {
    // Create some workout data for insights
    const db = getDb();

    // Add workout sessions
    for (let i = 0; i < 5; i++) {
      db.prepare(
        "INSERT INTO workout_sessions (user_id, name, started_at, ended_at) VALUES (?, ?, ?, ?)"
      ).run(clientUserId, `Workout ${i + 1}`, new Date().toISOString(), new Date().toISOString());
    }

    // Add a body measurement
    db.prepare(
      "INSERT INTO body_measurements (user_id, weight_kg, recorded_at) VALUES (?, ?, ?)"
    ).run(clientUserId, 82, new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString());
    db.prepare(
      "INSERT INTO body_measurements (user_id, weight_kg, recorded_at) VALUES (?, ?, ?)"
    ).run(clientUserId, 80, new Date().toISOString());
  });

  it("should generate insights for user", async () => {
    const res = await request(app)
      .post("/api/insights/generate")
      .set(clientAuth());
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Should have at least a workout insight and weight trend
    const types = res.body.map((i) => i.type);
    expect(types).toContain("warning"); // less than 8 workouts
    expect(types).toContain("trend"); // weight changed
  });

  it("should allow trainer to generate insights for client", async () => {
    const res = await request(app)
      .post(`/api/insights/generate/${clientUserId}`)
      .set(trainerAuth());
    expect(res.status).toBe(201);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should list insights", async () => {
    const res = await request(app)
      .get("/api/insights")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].type).toBeDefined();
    expect(res.body.data[0].title).toBeDefined();
    expect(res.body.data[0].body).toBeDefined();
  });

  it("should allow trainer to view client insights", async () => {
    const res = await request(app)
      .get(`/api/insights/client/${clientUserId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should mark insight as read", async () => {
    const listRes = await request(app)
      .get("/api/insights")
      .set(clientAuth());
    const insightId = listRes.body.data[0].id;

    const res = await request(app)
      .put(`/api/insights/${insightId}/read`)
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.is_read).toBe(1);
  });
});
