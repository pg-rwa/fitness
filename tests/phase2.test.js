const request = require("supertest");
const app = require("../src/app");
const { getDb, closeDb } = require("../src/config/database");

let trainerToken;
let trainerUserId;
let clientToken;
let clientUserId;

beforeAll(async () => {
  // Register trainer
  const trainerRes = await request(app).post("/api/auth/register").send({
    email: `p2-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Phase2",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;
  trainerUserId = trainerRes.body.user.id;

  // Register client
  const clientRes = await request(app).post("/api/auth/register").send({
    email: `p2-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "Phase2",
    lastName: "Client",
  });
  clientToken = clientRes.body.token;
  clientUserId = clientRes.body.user.id;

  // Link client to trainer
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

// ─── Equipment ───────────────────────────────────────────────

describe("Equipment API", () => {
  let equipmentId;

  it("should allow trainer to create equipment", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .set(trainerAuth())
      .send({
        name: "Lat Pulldown Machine",
        brand: "LifeFitness",
        category: "cable",
        defaultSettings: { seat: 3, pin_height: 5 },
        gymLocation: "Zone A",
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Lat Pulldown Machine");
    expect(res.body.category).toBe("cable");
    equipmentId = res.body.id;
  });

  it("should reject client creating equipment", async () => {
    const res = await request(app)
      .post("/api/equipment")
      .set(clientAuth())
      .send({ name: "Unauthorized", category: "machine" });
    expect(res.status).toBe(403);
  });

  it("should list equipment", async () => {
    const res = await request(app).get("/api/equipment").set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });

  it("should filter equipment by category", async () => {
    const res = await request(app).get("/api/equipment?category=cable").set(clientAuth());
    expect(res.status).toBe(200);
    for (const item of res.body.data) {
      expect(item.category).toBe("cable");
    }
  });

  it("should get equipment by id", async () => {
    const res = await request(app).get(`/api/equipment/${equipmentId}`).set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Lat Pulldown Machine");
  });

  it("should update equipment", async () => {
    const res = await request(app)
      .put(`/api/equipment/${equipmentId}`)
      .set(trainerAuth())
      .send({ defaultSettings: { seat: 4, pin_height: 6 }, notes: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("Updated");
  });

  it("should delete equipment", async () => {
    const toDelete = await request(app)
      .post("/api/equipment")
      .set(trainerAuth())
      .send({ name: "To Delete", category: "other" });

    const res = await request(app)
      .delete(`/api/equipment/${toDelete.body.id}`)
      .set(trainerAuth());
    expect(res.status).toBe(204);
  });
});

// ─── Enhanced Exercises ──────────────────────────────────────

describe("Enhanced Exercises API", () => {
  let customExerciseId;

  it("should allow trainer to create custom exercise", async () => {
    const res = await request(app)
      .post("/api/exercises")
      .set(trainerAuth())
      .send({
        name: "Custom Cable Fly",
        category: "strength",
        muscleGroup: "chest",
        secondaryMuscles: ["shoulders", "triceps"],
        instructions: "Stand with cables at chest height",
      });
    expect(res.status).toBe(201);
    expect(res.body.is_custom).toBe(1);
    expect(res.body.created_by).toBe(trainerUserId);
    customExerciseId = res.body.id;
  });

  it("should reject client creating exercise", async () => {
    const res = await request(app)
      .post("/api/exercises")
      .set(clientAuth())
      .send({ name: "Unauthorized", category: "strength", muscleGroup: "chest" });
    expect(res.status).toBe(403);
  });

  it("should update custom exercise", async () => {
    const res = await request(app)
      .put(`/api/exercises/${customExerciseId}`)
      .set(trainerAuth())
      .send({ description: "Great exercise for chest" });
    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Great exercise for chest");
  });

  it("should search exercises", async () => {
    const res = await request(app)
      .get("/api/exercises?search=Cable")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.some((e) => e.name.includes("Cable"))).toBe(true);
  });

  it("should filter custom exercises", async () => {
    const res = await request(app)
      .get("/api/exercises?custom=true")
      .set(clientAuth());
    expect(res.status).toBe(200);
    for (const ex of res.body) {
      expect(ex.is_custom).toBe(1);
    }
  });
});

// ─── Workout Templates ──────────────────────────────────────

describe("Workout Templates API", () => {
  let templateId;
  let templateExerciseId;

  it("should create a workout template", async () => {
    const res = await request(app)
      .post("/api/workout-templates")
      .set(trainerAuth())
      .send({
        name: "Push Day",
        description: "Chest, shoulders, triceps",
        category: "upper",
        difficulty: "intermediate",
        estimatedDurationMin: 60,
        isPublic: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Push Day");
    expect(res.body.is_public).toBe(1);
    expect(res.body.exercises).toEqual([]);
    templateId = res.body.id;
  });

  it("should add exercise to template", async () => {
    const res = await request(app)
      .post(`/api/workout-templates/${templateId}/exercises`)
      .set(trainerAuth())
      .send({
        exerciseId: 1,
        targetSets: 4,
        targetReps: 10,
        targetWeightKg: 60,
        restSeconds: 90,
      });
    expect(res.status).toBe(201);
    expect(res.body.target_sets).toBe(4);
    expect(res.body.target_reps).toBe(10);
    templateExerciseId = res.body.id;
  });

  it("should add another exercise with superset", async () => {
    const res = await request(app)
      .post(`/api/workout-templates/${templateId}/exercises`)
      .set(trainerAuth())
      .send({
        exerciseId: 2,
        targetSets: 3,
        targetReps: 12,
        supersetGroup: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.superset_group).toBe(1);
  });

  it("should get template with exercises", async () => {
    const res = await request(app)
      .get(`/api/workout-templates/${templateId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.exercises.length).toBe(2);
    expect(res.body.exercises[0].target_sets).toBe(4);
  });

  it("should list templates (own + public)", async () => {
    const res = await request(app)
      .get("/api/workout-templates")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should update template exercise", async () => {
    const res = await request(app)
      .put(`/api/workout-templates/${templateId}/exercises/${templateExerciseId}`)
      .set(trainerAuth())
      .send({ targetSets: 5, machineSettings: { seat: 3 } });
    expect(res.status).toBe(200);
    expect(res.body.target_sets).toBe(5);
    expect(res.body.machine_settings.seat).toBe(3);
  });

  it("should duplicate a template", async () => {
    const res = await request(app)
      .post(`/api/workout-templates/${templateId}/duplicate`)
      .set(trainerAuth());
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Push Day (Copy)");
    expect(res.body.exercises.length).toBe(2);
    expect(res.body.id).not.toBe(templateId);
  });

  it("should update template metadata", async () => {
    const res = await request(app)
      .put(`/api/workout-templates/${templateId}`)
      .set(trainerAuth())
      .send({ name: "Push Day v2", difficulty: "advanced" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Push Day v2");
    expect(res.body.difficulty).toBe("advanced");
  });

  it("should remove exercise from template", async () => {
    const res = await request(app)
      .delete(`/api/workout-templates/${templateId}/exercises/${templateExerciseId}`)
      .set(trainerAuth());
    expect(res.status).toBe(204);
  });
});

// ─── Workout Sessions ────────────────────────────────────────

describe("Workout Sessions API", () => {
  let sessionId;
  let sessionExerciseId;
  let setId;
  let templateIdForSession;

  beforeAll(async () => {
    // Create a template for session tests
    const tRes = await request(app)
      .post("/api/workout-templates")
      .set(trainerAuth())
      .send({
        name: "Session Test Template",
        isPublic: true,
      });
    templateIdForSession = tRes.body.id;

    // Add exercises to template
    await request(app)
      .post(`/api/workout-templates/${templateIdForSession}/exercises`)
      .set(trainerAuth())
      .send({ exerciseId: 1, targetSets: 3, targetReps: 10, targetWeightKg: 50 });

    await request(app)
      .post(`/api/workout-templates/${templateIdForSession}/exercises`)
      .set(trainerAuth())
      .send({ exerciseId: 2, targetSets: 3, targetReps: 12 });
  });

  it("should start a session from template", async () => {
    const res = await request(app)
      .post("/api/workout-sessions")
      .set(clientAuth())
      .send({ templateId: templateIdForSession, moodBefore: 7 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Session Test Template");
    expect(res.body.mood_before).toBe(7);
    expect(res.body.exercises.length).toBe(2);
    // Sets should be pre-populated from template
    expect(res.body.exercises[0].sets.length).toBe(3);
    sessionId = res.body.id;
    sessionExerciseId = res.body.exercises[0].id;
  });

  it("should start a blank session", async () => {
    const res = await request(app)
      .post("/api/workout-sessions")
      .set(clientAuth())
      .send({ name: "Quick Workout" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Quick Workout");
    expect(res.body.exercises.length).toBe(0);
  });

  it("should add exercise to session", async () => {
    const res = await request(app)
      .post(`/api/workout-sessions/${sessionId}/exercises`)
      .set(clientAuth())
      .send({ exerciseId: 3 });
    expect(res.status).toBe(201);
    expect(res.body.exercise_id).toBe(3);
  });

  it("should log a set", async () => {
    const res = await request(app)
      .post(`/api/workout-sessions/${sessionId}/exercises/${sessionExerciseId}/sets`)
      .set(clientAuth())
      .send({ reps: 10, weightKg: 60, completed: true, rpe: 7 });
    expect(res.status).toBe(201);
    expect(res.body.reps).toBe(10);
    expect(res.body.weight_kg).toBe(60);
    expect(res.body.completed).toBe(1);
    expect(res.body.rpe).toBe(7);
    setId = res.body.id;
  });

  it("should update a set", async () => {
    const res = await request(app)
      .put(`/api/workout-sessions/${sessionId}/exercises/${sessionExerciseId}/sets/${setId}`)
      .set(clientAuth())
      .send({ reps: 12, weightKg: 65, rpe: 8 });
    expect(res.status).toBe(200);
    expect(res.body.reps).toBe(12);
    expect(res.body.weight_kg).toBe(65);
  });

  it("should get full session with exercises and sets", async () => {
    const res = await request(app)
      .get(`/api/workout-sessions/${sessionId}`)
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.exercises.length).toBe(3);
    // The first exercise has pre-populated sets + our logged set
    expect(res.body.exercises[0].sets.length).toBeGreaterThan(0);
  });

  it("should list client sessions", async () => {
    const res = await request(app).get("/api/workout-sessions").set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });

  it("should complete a session with volume calculation", async () => {
    const res = await request(app)
      .put(`/api/workout-sessions/${sessionId}/complete`)
      .set(clientAuth())
      .send({ moodAfter: 9 });
    expect(res.status).toBe(200);
    expect(res.body.ended_at).toBeDefined();
    expect(res.body.mood_after).toBe(9);
    expect(res.body.total_volume).toBeGreaterThan(0);
  });

  it("should not allow modifications to completed session", async () => {
    const res = await request(app)
      .post(`/api/workout-sessions/${sessionId}/exercises`)
      .set(clientAuth())
      .send({ exerciseId: 4 });
    expect(res.status).toBe(403);
  });

  it("should allow trainer to view client sessions", async () => {
    const res = await request(app)
      .get(`/api/workout-sessions/client/${clientUserId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ─── Assigned Workouts ───────────────────────────────────────

describe("Assigned Workouts API", () => {
  let assignedId;
  let assignTemplateId;

  beforeAll(async () => {
    const tRes = await request(app)
      .post("/api/workout-templates")
      .set(trainerAuth())
      .send({ name: "Assigned Push Day" });
    assignTemplateId = tRes.body.id;
  });

  it("should assign workout to client", async () => {
    const res = await request(app)
      .post(`/api/assigned-workouts/client/${clientUserId}`)
      .set(trainerAuth())
      .send({ templateId: assignTemplateId, dayOfWeek: 1, notes: "Do this on Monday" });
    expect(res.status).toBe(201);
    expect(res.body.template_name).toBe("Assigned Push Day");
    expect(res.body.day_of_week).toBe(1);
    assignedId = res.body.id;
  });

  it("should list client assigned workouts (trainer view)", async () => {
    const res = await request(app)
      .get(`/api/assigned-workouts/client/${clientUserId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].template_name).toBeDefined();
  });

  it("should list own assigned workouts (client view)", async () => {
    const res = await request(app)
      .get("/api/assigned-workouts/mine")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should reject client assigning workouts", async () => {
    const res = await request(app)
      .post(`/api/assigned-workouts/client/${clientUserId}`)
      .set(clientAuth())
      .send({ templateId: assignTemplateId });
    expect(res.status).toBe(403);
  });

  it("should unassign workout", async () => {
    const res = await request(app)
      .delete(`/api/assigned-workouts/${assignedId}`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(0);
  });
});
