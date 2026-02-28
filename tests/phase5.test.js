const request = require("supertest");
const app = require("../src/app");
const { getDb, closeDb } = require("../src/config/database");
const { registerTestUser } = require("./helpers");

let trainerToken;
let trainerUserId;
let clientToken;
let clientUserId;
let chickenId;
let riceId;

beforeAll(async () => {
  const trainerRes = await registerTestUser(app, {
    email: `p5-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P5",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;
  trainerUserId = trainerRes.body.user.id;

  const clientRes = await registerTestUser(app, {
    email: `p5-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "P5",
    lastName: "Client",
  });
  clientToken = clientRes.body.token;
  clientUserId = clientRes.body.user.id;

  const db = getDb();
  db.prepare("UPDATE users SET trainer_id = ? WHERE id = ?").run(trainerUserId, clientUserId);

  // Get seeded food IDs
  chickenId = db.prepare("SELECT id FROM food_items WHERE name = 'Chicken Breast'").get().id;
  riceId = db.prepare("SELECT id FROM food_items WHERE name = 'Brown Rice'").get().id;
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

// ─── Food Items ──────────────────────────────────────────────

describe("Food Items API", () => {
  let customFoodId;

  it("should search foods", async () => {
    const res = await request(app)
      .get("/api/nutrition/foods?q=chicken")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toContain("Chicken");
  });

  it("should list all foods with pagination", async () => {
    const res = await request(app)
      .get("/api/nutrition/foods")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(20);
  });

  it("should get food by id", async () => {
    const res = await request(app)
      .get(`/api/nutrition/foods/${chickenId}`)
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Chicken Breast");
    expect(res.body.protein_g).toBe(31);
  });

  it("should create custom food item", async () => {
    const res = await request(app)
      .post("/api/nutrition/foods")
      .set(clientAuth())
      .send({
        name: "My Protein Bar",
        brand: "Custom Brand",
        servingSize: 60,
        servingUnit: "g",
        calories: 200,
        proteinG: 20,
        carbsG: 25,
        fatG: 8,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My Protein Bar");
    expect(res.body.created_by).toBe(clientUserId);
    customFoodId = res.body.id;
  });

  it("should update own food item", async () => {
    const res = await request(app)
      .put(`/api/nutrition/foods/${customFoodId}`)
      .set(clientAuth())
      .send({ calories: 210 });
    expect(res.status).toBe(200);
    expect(res.body.calories).toBe(210);
  });

  it("should allow trainer to verify food items", async () => {
    const res = await request(app)
      .put(`/api/nutrition/foods/${customFoodId}`)
      .set(trainerAuth())
      .send({ isVerified: true });
    expect(res.status).toBe(200);
    expect(res.body.is_verified).toBe(1);
  });
});

// ─── Meal Presets ────────────────────────────────────────────

describe("Meal Presets API", () => {
  let presetId;

  it("should create a meal preset", async () => {
    const res = await request(app)
      .post("/api/nutrition/presets")
      .set(trainerAuth())
      .send({
        name: "Post-Workout Meal",
        mealType: "dinner",
        isPublic: true,
        items: [
          { foodItemId: chickenId, quantity: 2 },
          { foodItemId: riceId, quantity: 1.5 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Post-Workout Meal");
    expect(res.body.items.length).toBe(2);
    expect(res.body.total_calories).toBeGreaterThan(0);
    expect(res.body.total_protein_g).toBeGreaterThan(0);
    presetId = res.body.id;
  });

  it("should list presets (own + public)", async () => {
    const res = await request(app)
      .get("/api/nutrition/presets")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should reject client creating preset", async () => {
    const res = await request(app)
      .post("/api/nutrition/presets")
      .set(clientAuth())
      .send({ name: "Client Preset" });
    expect(res.status).toBe(403);
  });

  it("should delete a preset", async () => {
    const toDelete = await request(app)
      .post("/api/nutrition/presets")
      .set(trainerAuth())
      .send({ name: "To Delete" });

    const res = await request(app)
      .delete(`/api/nutrition/presets/${toDelete.body.id}`)
      .set(trainerAuth());
    expect(res.status).toBe(204);
  });
});

// ─── Meal Logging ────────────────────────────────────────────

describe("Meal Logging API", () => {
  let mealLogId;

  it("should log a meal", async () => {
    const res = await request(app)
      .post("/api/nutrition/meals")
      .set(clientAuth())
      .send({
        mealType: "lunch",
        loggedAt: "2026-02-20T12:00:00Z",
        notes: "Post-workout meal",
        items: [
          { foodItemId: chickenId, quantity: 1.5 },
          { foodItemId: riceId, quantity: 2 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.meal_type).toBe("lunch");
    expect(res.body.items.length).toBe(2);
    expect(res.body.items[0].calories).toBeGreaterThan(0);
    mealLogId = res.body.id;
  });

  it("should log another meal for same day", async () => {
    const res = await request(app)
      .post("/api/nutrition/meals")
      .set(clientAuth())
      .send({
        mealType: "dinner",
        loggedAt: "2026-02-20T19:00:00Z",
        items: [{ foodItemId: chickenId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
  });

  it("should get meals by date", async () => {
    const res = await request(app)
      .get("/api/nutrition/meals?date=2026-02-20")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].items.length).toBeGreaterThan(0);
  });

  it("should allow trainer to view client meals", async () => {
    const res = await request(app)
      .get(`/api/nutrition/meals/client/${clientUserId}?date=2026-02-20`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("should delete a meal", async () => {
    const res = await request(app)
      .delete(`/api/nutrition/meals/${mealLogId}`)
      .set(clientAuth());
    expect(res.status).toBe(204);
  });
});

// ─── Nutrition Summary & Targets ─────────────────────────────

describe("Nutrition Summary & Targets API", () => {
  it("should get daily nutrition summary", async () => {
    const res = await request(app)
      .get("/api/nutrition/summary?date=2026-02-20")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.total_calories).toBeGreaterThan(0);
    expect(res.body.total_protein_g).toBeGreaterThan(0);
    expect(res.body.total_carbs_g).toBeDefined();
    expect(res.body.total_fat_g).toBeDefined();
  });

  it("should set nutrition targets for client", async () => {
    const res = await request(app)
      .put(`/api/nutrition/targets/${clientUserId}`)
      .set(trainerAuth())
      .send({
        calorieTarget: 2200,
        proteinTargetG: 180,
        carbsTargetG: 250,
        fatTargetG: 70,
      });
    expect(res.status).toBe(200);
    expect(res.body.calorieTarget).toBe(2200);
    expect(res.body.proteinTargetG).toBe(180);
  });

  it("should include targets in daily summary", async () => {
    const res = await request(app)
      .get("/api/nutrition/summary?date=2026-02-20")
      .set(clientAuth());
    expect(res.status).toBe(200);
    expect(res.body.targets).toBeDefined();
    expect(res.body.targets.calorieTarget).toBe(2200);
  });

  it("should allow trainer to view client summary", async () => {
    const res = await request(app)
      .get(`/api/nutrition/summary/client/${clientUserId}?date=2026-02-20`)
      .set(trainerAuth());
    expect(res.status).toBe(200);
    expect(res.body.total_calories).toBeGreaterThan(0);
  });
});
