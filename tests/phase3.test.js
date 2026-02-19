const request = require("supertest");
const app = require("../src/app");
const { getDb, closeDb } = require("../src/config/database");

let trainerToken;
let trainerUserId;
let clientToken;
let clientUserId;

beforeAll(async () => {
  const trainerRes = await request(app).post("/api/auth/register").send({
    email: `p3-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P3",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;
  trainerUserId = trainerRes.body.user.id;

  const clientRes = await request(app).post("/api/auth/register").send({
    email: `p3-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P3",
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

// ─── Body Measurements ───────────────────────────────────────

describe("Body Measurements API", () => {
  it("should record a measurement", async () => {
    const res = await request(app)
      .post("/api/progress/measurements")
      .set(clientAuth())
      .send({
        weightKg: 80.5,
        bodyFatPct: 18,
        chestCm: 100,
        waistCm: 85,
        notes: "Morning measurement",
      });
    expect(res.status).toBe(201);
    expect(res.body.weight_kg).toBe(80.5);
    expect(res.body.body_fat_pct).toBe(18);
  });

  it("should record another measurement for trend data", async () => {
    const res = await request(app)
      .post("/api/progress/measurements")
      .set(clientAuth())
      .send({
        weightKg: 79.8,
        bodyFatPct: 17.5,
        chestCm: 101,
        waistCm: 84,
        recordedAt: "2026-02-20T08:00:00.000Z",
      });
    expect(res.status).toBe(201);
    expect(res.body.weight_kg).toBe(79.8);
  });

  it("should list measurements with pagination", async () => {
    const res = await request(app)
      .get("/api/progress/measurements")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination).toBeDefined();
  });

  it("should get latest measurement", async () => {
    const res = await request(app)
      .get("/api/progress/measurements/latest")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.weight_kg).toBeDefined();
  });

  it("should get measurement trends", async () => {
    const res = await request(app)
      .get("/api/progress/measurements/trends?metric=weight_kg")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.metric).toBe("weight_kg");
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].value).toBeDefined();
  });

  it("should allow trainer to view client measurements", async () => {
    const res = await request(app)
      .get(`/api/progress/measurements/client/${clientUserId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it("should allow trainer to view client trends", async () => {
    const res = await request(app)
      .get(`/api/progress/measurements/client/${clientUserId}/trends?metric=body_fat_pct`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.metric).toBe("body_fat_pct");
  });
});

// ─── Progress Photos ─────────────────────────────────────────

describe("Progress Photos API", () => {
  let photoId;

  it("should upload a progress photo", async () => {
    const res = await request(app)
      .post("/api/progress/photos")
      .set(clientAuth())
      .send({
        photoUrl: "/uploads/front-1.jpg",
        category: "front",
        notes: "Week 1",
        takenAt: "2026-02-01T08:00:00.000Z",
      });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe("front");
    photoId = res.body.id;
  });

  it("should upload another photo for comparison", async () => {
    const res = await request(app)
      .post("/api/progress/photos")
      .set(clientAuth())
      .send({
        photoUrl: "/uploads/front-2.jpg",
        category: "front",
        notes: "Week 4",
        takenAt: "2026-02-28T08:00:00.000Z",
      });
    expect(res.status).toBe(201);
  });

  it("should list photos", async () => {
    const res = await request(app)
      .get("/api/progress/photos")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("should filter photos by category", async () => {
    const res = await request(app)
      .get("/api/progress/photos?category=front")
      .set(clientAuth());
    expect(res.status).toBe(200);
    for (const p of res.body) {
      expect(p.category).toBe("front");
    }
  });

  it("should compare photos", async () => {
    const res = await request(app)
      .get("/api/progress/photos/compare?date1=2026-02-15&date2=2026-03-01&category=front")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.before).toBeDefined();
    expect(res.body.after).toBeDefined();
    expect(res.body.before.photo_url).toBe("/uploads/front-1.jpg");
    expect(res.body.after.photo_url).toBe("/uploads/front-2.jpg");
  });

  it("should allow trainer to view client photos", async () => {
    const res = await request(app)
      .get(`/api/progress/photos/client/${clientUserId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("should delete a photo", async () => {
    const res = await request(app)
      .delete(`/api/progress/photos/${photoId}`)
      .set(clientAuth());
    expect(res.status).toBe(204);
  });
});

// ─── Calendar ────────────────────────────────────────────────

describe("Calendar API", () => {
  beforeAll(async () => {
    // Create a workout session for calendar
    await request(app)
      .post("/api/workout-sessions")
      .set(clientAuth())
      .send({ name: "Calendar Workout" });
  });

  it("should return unified calendar events", async () => {
    const res = await request(app)
      .get("/api/calendar?start=2026-01-01T00:00:00Z&end=2026-12-31T23:59:59Z")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Should contain workout sessions
    const workoutEvents = res.body.filter((e) => e.type === "workout_session");
    expect(workoutEvents.length).toBeGreaterThan(0);

    // Should contain measurements
    const measurementEvents = res.body.filter((e) => e.type === "measurement");
    expect(measurementEvents.length).toBeGreaterThan(0);

    // Each event should have required fields
    for (const event of res.body) {
      expect(event.type).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.datetime).toBeDefined();
      expect(event.status).toBeDefined();
      expect(event.entity_id).toBeDefined();
    }
  });

  it("should require start and end dates", async () => {
    const res = await request(app)
      .get("/api/calendar")
      .set(clientAuth());
    expect(res.status).toBe(400);
  });
});
