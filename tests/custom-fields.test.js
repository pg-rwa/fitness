const request = require("supertest");
const app = require("../src/app");
const { closeDb } = require("../src/config/database");
const { registerTestUser } = require("./helpers");

let trainerToken;
let clientToken;
let clientUserId;

beforeAll(async () => {
  const trainerRes = await registerTestUser(app, {
    email: `cf-trainer-${Date.now()}@example.com`,
    password: "password123",
    firstName: "CF",
    lastName: "Trainer",
    role: "trainer",
  });
  trainerToken = trainerRes.body.token;

  const clientRes = await registerTestUser(app, {
    email: `cf-client-${Date.now()}@example.com`,
    password: "password123",
    firstName: "CF",
    lastName: "Client",
  });
  clientToken = clientRes.body.token;
  clientUserId = clientRes.body.user.id;
});

afterAll(() => {
  closeDb();
});

describe("Custom Fields API", () => {
  let fieldDefId;

  describe("Definitions", () => {
    it("should allow trainer to create field definition", async () => {
      const res = await request(app)
        .post("/api/custom-fields/definitions")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          entityType: "user",
          name: "preferred_workout_time",
          fieldType: "select",
          options: { choices: ["morning", "afternoon", "evening"] },
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("preferred_workout_time");
      expect(res.body.field_type).toBe("select");
      fieldDefId = res.body.id;
    });

    it("should reject client creating field definition", async () => {
      const res = await request(app)
        .post("/api/custom-fields/definitions")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          entityType: "user",
          name: "unauthorized_field",
          fieldType: "text",
        });
      expect(res.status).toBe(403);
    });

    it("should reject duplicate field definition", async () => {
      const res = await request(app)
        .post("/api/custom-fields/definitions")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          entityType: "user",
          name: "preferred_workout_time",
          fieldType: "text",
        });
      expect(res.status).toBe(409);
    });

    it("should list field definitions by entity type", async () => {
      const res = await request(app)
        .get("/api/custom-fields/definitions?entityType=user")
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((d) => d.name === "preferred_workout_time")).toBe(true);
    });

    it("should update field definition", async () => {
      const res = await request(app)
        .put(`/api/custom-fields/definitions/${fieldDefId}`)
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({ options: { choices: ["morning", "afternoon", "evening", "night"] } });
      expect(res.status).toBe(200);
      const opts = JSON.parse(res.body.options);
      expect(opts.choices).toContain("night");
    });
  });

  describe("Values", () => {
    it("should set custom field values on an entity", async () => {
      const res = await request(app)
        .put(`/api/custom-fields/values/user/${clientUserId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          fields: [{ fieldDefId, value: "morning" }],
        });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].value).toBe("morning");
      expect(res.body[0].field_name).toBe("preferred_workout_time");
    });

    it("should get custom field values for an entity", async () => {
      const res = await request(app)
        .get(`/api/custom-fields/values/user/${clientUserId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].value).toBe("morning");
    });

    it("should overwrite existing field value", async () => {
      await request(app)
        .put(`/api/custom-fields/values/user/${clientUserId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({
          fields: [{ fieldDefId, value: "evening" }],
        });

      const res = await request(app)
        .get(`/api/custom-fields/values/user/${clientUserId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(res.body[0].value).toBe("evening");
    });
  });

  describe("Cleanup", () => {
    it("should delete field definition and cascade values", async () => {
      const res = await request(app)
        .delete(`/api/custom-fields/definitions/${fieldDefId}`)
        .set("Authorization", `Bearer ${trainerToken}`);
      expect(res.status).toBe(204);

      const valuesRes = await request(app)
        .get(`/api/custom-fields/values/user/${clientUserId}`)
        .set("Authorization", `Bearer ${clientToken}`);
      expect(valuesRes.body.length).toBe(0);
    });
  });
});
