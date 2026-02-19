const { getDb } = require("../config/database");

function getProfile(req, res, next) {
  try {
    const db = getDb();
    const user = db
      .prepare("SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?")
      .get(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = db
      .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
      .get(req.userId);

    res.json({ ...user, profile: profile || null });
  } catch (err) {
    next(err);
  }
}

function updateProfile(req, res, next) {
  try {
    const db = getDb();
    const { heightCm, weightKg, dateOfBirth, gender, fitnessLevel } = req.body;

    const existing = db
      .prepare("SELECT id FROM user_profiles WHERE user_id = ?")
      .get(req.userId);

    if (existing) {
      const fields = [];
      const values = [];
      if (heightCm !== undefined) { fields.push("height_cm = ?"); values.push(heightCm); }
      if (weightKg !== undefined) { fields.push("weight_kg = ?"); values.push(weightKg); }
      if (dateOfBirth !== undefined) { fields.push("date_of_birth = ?"); values.push(dateOfBirth); }
      if (gender !== undefined) { fields.push("gender = ?"); values.push(gender); }
      if (fitnessLevel !== undefined) { fields.push("fitness_level = ?"); values.push(fitnessLevel); }
      fields.push("updated_at = datetime('now')");
      values.push(req.userId);

      db.prepare(`UPDATE user_profiles SET ${fields.join(", ")} WHERE user_id = ?`).run(...values);
    } else {
      db.prepare(
        "INSERT INTO user_profiles (user_id, height_cm, weight_kg, date_of_birth, gender, fitness_level) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(
        req.userId,
        heightCm || null,
        weightKg || null,
        dateOfBirth || null,
        gender || null,
        fitnessLevel || "beginner"
      );
    }

    const profile = db
      .prepare("SELECT * FROM user_profiles WHERE user_id = ?")
      .get(req.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
