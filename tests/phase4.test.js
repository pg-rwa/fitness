const request = require("supertest");
const app = require("../src/app");
const { getDb, closeDb } = require("../src/config/database");
const { registerTestUser } = require("./helpers");

let trainerToken;
let trainerUserId;
let clientToken;
let clientUserId;

beforeAll(async () => {
  const trainerRes = await registerTestUser(app, {
    email: `p4-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P4",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;
  trainerUserId = trainerRes.body.user.id;

  const clientRes = await registerTestUser(app, {
    email: `p4-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P4",
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

function trainerAuth() {
  return { Authorization: `Bearer ${trainerToken}` };
}
function clientAuth() {
  return { Authorization: `Bearer ${clientToken}` };
}

// ─── Trainer Availability ────────────────────────────────────

describe("Trainer Availability API", () => {
  it("should set trainer availability", async () => {
    const res = await request(app)
      .put("/api/scheduling/availability")
      .set(trainerAuth())
      .send({
        slots: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 5, startTime: "10:00", endTime: "15:00" },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
  });

  it("should get own availability", async () => {
    const res = await request(app)
      .get("/api/scheduling/availability")
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
  });

  it("should allow client to view trainer availability", async () => {
    const res = await request(app)
      .get(`/api/scheduling/availability/${trainerUserId}`)
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
  });

  it("should reject client setting availability", async () => {
    const res = await request(app)
      .put("/api/scheduling/availability")
      .set(clientAuth())
      .send({ slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00" }] });
    expect(res.status).toBe(403);
  });
});

// ─── Session Scheduling ──────────────────────────────────────

describe("Session Scheduling API", () => {
  let sessionId;

  it("should allow client to request a session", async () => {
    const res = await request(app)
      .post("/api/scheduling/sessions")
      .set(clientAuth())
      .send({
        trainerId: trainerUserId,
        title: "Personal Training",
        scheduledStart: "2026-03-02T09:00:00Z",
        scheduledEnd: "2026-03-02T10:00:00Z",
        notes: "First session",
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("requested");
    expect(res.body.requested_by).toBe("client");
    sessionId = res.body.id;
  });

  it("should auto-approve trainer-created sessions", async () => {
    const res = await request(app)
      .post("/api/scheduling/sessions")
      .set(trainerAuth())
      .send({
        clientId: clientUserId,
        title: "Trainer Initiated",
        scheduledStart: "2026-03-04T14:00:00Z",
        scheduledEnd: "2026-03-04T15:00:00Z",
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("approved");
    expect(res.body.requested_by).toBe("trainer");
  });

  it("should prevent double-booking", async () => {
    const res = await request(app)
      .post("/api/scheduling/sessions")
      .set(clientAuth())
      .send({
        trainerId: trainerUserId,
        title: "Conflicting Session",
        scheduledStart: "2026-03-02T09:30:00Z",
        scheduledEnd: "2026-03-02T10:30:00Z",
      });
    expect(res.status).toBe(400);
  });

  it("should list sessions", async () => {
    const res = await request(app)
      .get("/api/scheduling/sessions")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should approve a session", async () => {
    const res = await request(app)
      .put(`/api/scheduling/sessions/${sessionId}/approve`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("should complete a session", async () => {
    const res = await request(app)
      .put(`/api/scheduling/sessions/${sessionId}/complete`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("should decline a session", async () => {
    // Create another session to decline
    const createRes = await request(app)
      .post("/api/scheduling/sessions")
      .set(clientAuth())
      .send({
        trainerId: trainerUserId,
        title: "To Decline",
        scheduledStart: "2026-03-10T09:00:00Z",
        scheduledEnd: "2026-03-10T10:00:00Z",
      });

    const res = await request(app)
      .put(`/api/scheduling/sessions/${createRes.body.id}/decline`)
      .set(trainerAuth())
      .send({ reason: "Unavailable that day" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("declined");
    expect(res.body.decline_reason).toBe("Unavailable that day");
  });

  it("should cancel a session", async () => {
    const createRes = await request(app)
      .post("/api/scheduling/sessions")
      .set(trainerAuth())
      .send({
        clientId: clientUserId,
        title: "To Cancel",
        scheduledStart: "2026-03-11T09:00:00Z",
        scheduledEnd: "2026-03-11T10:00:00Z",
      });

    const res = await request(app)
      .put(`/api/scheduling/sessions/${createRes.body.id}/cancel`)
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });

  it("should get available slots", async () => {
    const res = await request(app)
      .get(`/api/scheduling/sessions/available-slots?trainerId=${trainerUserId}&date=2026-03-09`)
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Notifications ───────────────────────────────────────────

describe("Notifications API", () => {
  it("should have generated notifications from scheduling events", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.unreadCount).toBeGreaterThan(0);
  });

  it("should have notified client about approved session", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set(clientAuth());
    expect(res.status).toBe(200);
    const approved = res.body.data.find((n) => n.type === "session_approved");
    expect(approved).toBeDefined();
  });

  it("should mark notification as read", async () => {
    const listRes = await request(app)
      .get("/api/notifications")
      .set(trainerAuth());
    const notifId = listRes.body.data[0].id;

    const res = await request(app)
      .put(`/api/notifications/${notifId}/read`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.is_read).toBe(1);
  });

  it("should mark all as read", async () => {
    const res = await request(app)
      .put("/api/notifications/read-all")
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.updated).toBeDefined();

    // Verify unread count is now 0
    const listRes = await request(app)
      .get("/api/notifications")
      .set(trainerAuth());
    expect(listRes.body.unreadCount).toBe(0);
  });
});
