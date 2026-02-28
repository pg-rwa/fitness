const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/config/database");
const { registerTestUser } = require("./helpers");

let authToken;
let userId;
let exerciseIds = [];

beforeAll(async () => {
  const res = await registerTestUser(app, {
    email: `fitness-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Fitness",
    lastName: "Tester",
  });
  authToken = res.body.token;
  userId = res.body.user.id;

  // Fetch real exercise IDs from DB
  const exRes = await request(app).get("/api/exercises").set({ Authorization: `Bearer ${authToken}` });
  if (exRes.body.length > 0) {
    exerciseIds = exRes.body.slice(0, 5).map((e) => e.id);
  }
});

afterAll(() => {
  closeDb();
});

function auth() {
  return { Authorization: `Bearer ${authToken}` };
}

describe("Exercises API", () => {
  it("should list exercises", async () => {
    const res = await request(app).get("/api/exercises").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should filter exercises by category", async () => {
    const res = await request(app).get("/api/exercises?category=cardio").set(auth());
    expect(res.status).toBe(200);
    for (const ex of res.body) {
      expect(ex.category).toBe("cardio");
    }
  });

  it("should get exercise by id", async () => {
    const exId = exerciseIds[0];
    const res = await request(app).get(`/api/exercises/${exId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(exId);
    expect(res.body.name).toBeDefined();
  });

  it("should return 404 for unknown exercise", async () => {
    const res = await request(app).get("/api/exercises/99999").set(auth());
    expect(res.status).toBe(404);
  });
});

describe("Workouts API", () => {
  let workoutId;

  it("should create a workout", async () => {
    const res = await request(app)
      .post("/api/workouts")
      .set(auth())
      .send({ name: "Morning Workout", notes: "Full body day" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Morning Workout");
    workoutId = res.body.id;
  });

  it("should list workouts", async () => {
    const res = await request(app).get("/api/workouts").set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should add exercise to workout", async () => {
    const res = await request(app)
      .post(`/api/workouts/${workoutId}/exercises`)
      .set(auth())
      .send({
        exerciseId: exerciseIds[0],
        sets: [
          { reps: 10, weightKg: 60 },
          { reps: 8, weightKg: 65 },
          { reps: 6, weightKg: 70 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.sets.length).toBe(3);
  });

  it("should get workout by id with exercises", async () => {
    const res = await request(app).get(`/api/workouts/${workoutId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.exercises.length).toBe(1);
    expect(res.body.exercises[0].sets.length).toBe(3);
  });

  it("should complete a workout", async () => {
    const res = await request(app)
      .put(`/api/workouts/${workoutId}/complete`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ended_at).toBeDefined();
  });
});

describe("Goals API", () => {
  let goalId;

  it("should create a goal", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set(auth())
      .send({ title: "Run 5K", description: "Complete a 5K race", targetDate: "2026-06-01" });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Run 5K");
    goalId = res.body.id;
  });

  it("should list goals", async () => {
    const res = await request(app).get("/api/goals").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should update a goal", async () => {
    const res = await request(app)
      .put(`/api/goals/${goalId}`)
      .set(auth())
      .send({ status: "completed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("should delete a goal", async () => {
    const res = await request(app).delete(`/api/goals/${goalId}`).set(auth());
    expect(res.status).toBe(204);
  });
});

describe("User Profile API", () => {
  it("should update profile", async () => {
    const res = await request(app)
      .put("/api/users/me/profile")
      .set(auth())
      .send({ heightCm: 180, weightKg: 75, fitnessLevel: "intermediate" });
    expect(res.status).toBe(200);
    expect(res.body.height_cm).toBe(180);
    expect(res.body.fitness_level).toBe("intermediate");
  });

  it("should get profile with user info", async () => {
    const res = await request(app).get("/api/users/me").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.height_cm).toBe(180);
  });
});
