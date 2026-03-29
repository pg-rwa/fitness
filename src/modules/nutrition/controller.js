const { getDb } = require("../../config/database");
const { NotFoundError, ForbiddenError } = require("../../shared/utils/errors");
const { paginate, paginatedResponse } = require("../../shared/utils/pagination");
const { eventBus } = require("../../shared/services/event-bus");

// ─── Food Items ──────────────────────────────────────────────

function searchFoods(req, res, next) {
  try {
    const db = getDb();
    const { q, barcode } = req.query;
    const { page, limit, offset, sql: pagSql } = paginate(req.query);

    if (barcode) {
      const item = db.prepare("SELECT * FROM food_items WHERE barcode = ?").get(barcode);
      return res.json(item ? [item] : []);
    }

    let sql = "SELECT * FROM food_items";
    let countSql = "SELECT COUNT(*) as total FROM food_items";
    const params = [];

    if (q) {
      sql += " WHERE (name LIKE ? OR brand LIKE ?)";
      countSql += " WHERE (name LIKE ? OR brand LIKE ?)";
      const s = `%${q}%`;
      params.push(s, s);
    }

    const { total } = db.prepare(countSql).get(...params);
    sql += " ORDER BY is_verified DESC, name ASC" + pagSql;
    const data = db.prepare(sql).all(...params);

    res.json(paginatedResponse(data, { page, limit, total }));
  } catch (err) {
    next(err);
  }
}

function getFoodById(req, res, next) {
  try {
    const db = getDb();
    const item = db.prepare("SELECT * FROM food_items WHERE id = ?").get(parseInt(req.params.id, 10));
    if (!item) throw new NotFoundError("Food item");
    res.json(item);
  } catch (err) {
    next(err);
  }
}

function createFood(req, res, next) {
  try {
    const db = getDb();
    const { name, brand, servingSize, servingUnit, calories, proteinG, carbsG, fatG, fiberG, sugarG, sodiumMg, barcode } = req.body;

    const result = db
      .prepare(
        `INSERT INTO food_items (name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, barcode, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name, brand || null, servingSize || 100, servingUnit || "g", calories || 0, proteinG || 0, carbsG || 0, fatG || 0, fiberG || 0, sugarG || 0, sodiumMg || 0, barcode || null, req.userId);

    const item = db.prepare("SELECT * FROM food_items WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

function updateFood(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    const item = db.prepare("SELECT * FROM food_items WHERE id = ?").get(id);
    if (!item) throw new NotFoundError("Food item");

    if (item.created_by !== req.userId && req.userRole !== "admin" && req.userRole !== "trainer") {
      throw new ForbiddenError("Can only update your own food items");
    }

    const fields = [];
    const values = [];
    const allowed = {
      name: "name", brand: "brand", servingSize: "serving_size", servingUnit: "serving_unit",
      calories: "calories", proteinG: "protein_g", carbsG: "carbs_g", fatG: "fat_g",
      fiberG: "fiber_g", sugarG: "sugar_g", sodiumMg: "sodium_mg", barcode: "barcode",
      isVerified: "is_verified",
    };

    for (const [bodyKey, dbKey] of Object.entries(allowed)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(bodyKey === "isVerified" ? (req.body[bodyKey] ? 1 : 0) : req.body[bodyKey]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE food_items SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare("SELECT * FROM food_items WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ─── Meal Presets ────────────────────────────────────────────

function listPresets(req, res, next) {
  try {
    const db = getDb();
    const presets = db
      .prepare("SELECT * FROM meal_presets WHERE created_by = ? OR is_public = 1 ORDER BY name")
      .all(req.userId);
    res.json(presets);
  } catch (err) {
    next(err);
  }
}

function createPreset(req, res, next) {
  try {
    const db = getDb();
    const { name, description, mealType, isPublic, items } = req.body;

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

    // Calculate totals from items
    if (items && items.length > 0) {
      for (const item of items) {
        const food = db.prepare("SELECT * FROM food_items WHERE id = ?").get(item.foodItemId);
        if (food) {
          const multiplier = (item.quantity || 1) * (food.serving_size / 100);
          totalCalories += food.calories * (item.quantity || 1);
          totalProtein += food.protein_g * (item.quantity || 1);
          totalCarbs += food.carbs_g * (item.quantity || 1);
          totalFat += food.fat_g * (item.quantity || 1);
        }
      }
    }

    const result = db
      .prepare(
        `INSERT INTO meal_presets (name, description, meal_type, is_public, total_calories, total_protein_g, total_carbs_g, total_fat_g, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name, description || null, mealType || "any", isPublic ? 1 : 0, totalCalories, totalProtein, totalCarbs, totalFat, req.userId);

    const presetId = result.lastInsertRowid;

    if (items && items.length > 0) {
      const insert = db.prepare(
        "INSERT INTO meal_preset_items (preset_id, food_item_id, quantity, unit) VALUES (?, ?, ?, ?)"
      );
      for (const item of items) {
        insert.run(presetId, item.foodItemId, item.quantity || 1, item.unit || "serving");
      }
    }

    const preset = db.prepare("SELECT * FROM meal_presets WHERE id = ?").get(presetId);
    preset.items = db.prepare("SELECT mpi.*, fi.name as food_name, fi.calories, fi.protein_g, fi.carbs_g, fi.fat_g FROM meal_preset_items mpi JOIN food_items fi ON mpi.food_item_id = fi.id WHERE mpi.preset_id = ?").all(presetId);
    res.status(201).json(preset);
  } catch (err) {
    next(err);
  }
}

function deletePreset(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    const preset = db.prepare("SELECT * FROM meal_presets WHERE id = ?").get(id);
    if (!preset) throw new NotFoundError("Meal preset");
    if (preset.created_by !== req.userId && req.userRole !== "admin") throw new ForbiddenError();

    db.prepare("DELETE FROM meal_presets WHERE id = ?").run(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ─── Meal Logging ────────────────────────────────────────────

async function logMeal(req, res, next) {
  try {
    const db = getDb();
    const { mealType, loggedAt, photoUrl, notes, items } = req.body;

    const result = db
      .prepare(
        "INSERT INTO meal_logs (user_id, meal_type, logged_at, photo_url, notes) VALUES (?, ?, ?, ?, ?)"
      )
      .run(req.userId, mealType || "snack", loggedAt || new Date().toISOString(), photoUrl || null, notes || null);

    const mealLogId = result.lastInsertRowid;

    if (items && items.length > 0) {
      const insert = db.prepare(
        "INSERT INTO meal_log_items (meal_log_id, food_item_id, quantity, unit, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );

      for (const item of items) {
        const food = db.prepare("SELECT * FROM food_items WHERE id = ?").get(item.foodItemId);
        if (food) {
          const qty = item.quantity || 1;
          insert.run(
            mealLogId, item.foodItemId, qty, item.unit || "serving",
            food.calories * qty, food.protein_g * qty, food.carbs_g * qty, food.fat_g * qty
          );
        }
      }
    }

    const meal = getMealWithItems(db, mealLogId);
    await eventBus.emit("meal.logged", { meal, userId: req.userId });
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
}

function getMealWithItems(db, id) {
  const meal = db.prepare("SELECT * FROM meal_logs WHERE id = ?").get(id);
  if (!meal) return null;
  meal.items = db
    .prepare(
      `SELECT mli.*, fi.name as food_name FROM meal_log_items mli
       JOIN food_items fi ON mli.food_item_id = fi.id
       WHERE mli.meal_log_id = ?`
    )
    .all(id);
  return meal;
}

function getMealsByDate(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    const { date } = req.query;

    if (targetUserId !== req.userId && req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(targetUserId);
      if (!client || client.trainer_id !== req.userId) throw new ForbiddenError();
    }

    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const meals = db
      .prepare("SELECT * FROM meal_logs WHERE user_id = ? AND logged_at >= ? AND logged_at <= ? ORDER BY logged_at")
      .all(targetUserId, startOfDay, endOfDay);

    for (const meal of meals) {
      meal.items = db
        .prepare(
          "SELECT mli.*, fi.name as food_name FROM meal_log_items mli JOIN food_items fi ON mli.food_item_id = fi.id WHERE mli.meal_log_id = ?"
        )
        .all(meal.id);
    }

    res.json(meals);
  } catch (err) {
    next(err);
  }
}

function deleteMeal(req, res, next) {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    const meal = db.prepare("SELECT * FROM meal_logs WHERE id = ? AND user_id = ?").get(id, req.userId);
    if (!meal) throw new NotFoundError("Meal log");

    db.prepare("DELETE FROM meal_logs WHERE id = ?").run(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function dailySummary(req, res, next) {
  try {
    const db = getDb();
    const targetUserId = req.params.clientId ? parseInt(req.params.clientId, 10) : req.userId;
    const { date, start, end } = req.query;

    if (targetUserId !== req.userId && req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(targetUserId);
      if (!client || client.trainer_id !== req.userId) throw new ForbiddenError();
    }

    let startDate, endDate;
    if (date) {
      startDate = `${date}T00:00:00`;
      endDate = `${date}T23:59:59`;
    } else {
      startDate = start;
      endDate = end;
    }

    const summary = db
      .prepare(
        `SELECT
           COALESCE(SUM(mli.calories), 0) as total_calories,
           COALESCE(SUM(mli.protein_g), 0) as total_protein_g,
           COALESCE(SUM(mli.carbs_g), 0) as total_carbs_g,
           COALESCE(SUM(mli.fat_g), 0) as total_fat_g
         FROM meal_logs ml
         JOIN meal_log_items mli ON ml.id = mli.meal_log_id
         WHERE ml.user_id = ? AND ml.logged_at >= ? AND ml.logged_at <= ?`
      )
      .get(targetUserId, startDate, endDate);

    // Get nutrition targets from profile
    const profile = db.prepare("SELECT preferences FROM user_profiles WHERE user_id = ?").get(targetUserId);
    let targets = null;
    if (profile && profile.preferences) {
      try {
        const prefs = JSON.parse(profile.preferences);
        if (prefs.nutritionTargets) targets = prefs.nutritionTargets;
      } catch {}
    }

    res.json({ ...summary, targets, date: date || `${start} to ${end}` });
  } catch (err) {
    next(err);
  }
}

// ─── Nutrition Targets ───────────────────────────────────────

function setNutritionTargets(req, res, next) {
  try {
    const db = getDb();
    const clientId = parseInt(req.params.clientId, 10);

    // Must be trainer of this client or admin
    if (req.userRole !== "admin") {
      const client = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(clientId);
      if (!client || client.trainer_id !== req.userId) throw new ForbiddenError();
    }

    const { calorieTarget, proteinTargetG, carbsTargetG, fatTargetG } = req.body;
    const targets = { calorieTarget, proteinTargetG, carbsTargetG, fatTargetG };

    const profile = db.prepare("SELECT * FROM user_profiles WHERE user_id = ?").get(clientId);

    if (profile) {
      let prefs = {};
      try { prefs = JSON.parse(profile.preferences || "{}"); } catch {}
      prefs.nutritionTargets = targets;
      db.prepare("UPDATE user_profiles SET preferences = ?, updated_at = datetime('now') WHERE user_id = ?")
        .run(JSON.stringify(prefs), clientId);
    } else {
      db.prepare("INSERT INTO user_profiles (user_id, preferences) VALUES (?, ?)")
        .run(clientId, JSON.stringify({ nutritionTargets: targets }));
    }

    res.json(targets);
  } catch (err) {
    next(err);
  }
}

// ─── AI Meal Photo Analysis ─────────────────────────────────

async function analyzeMealPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const fs = require("fs");
    const sharp = require("sharp");
    const imagePath = req.file.path;

    // Resize image to fit Claude API limits (max 1568px on longest side)
    // This also reduces base64 payload size for faster analysis
    let resizedBuffer;
    try {
      resizedBuffer = await sharp(imagePath)
        .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (resizeErr) {
      console.error("[nutrition] Image resize error:", resizeErr.message);
      // Fallback to raw file if resize fails
      resizedBuffer = fs.readFileSync(imagePath);
    }

    const base64Image = resizedBuffer.toString("base64");
    const mimeType = "image/jpeg";

    // Clean up temp file
    fs.unlink(imagePath, () => {});

    let analysis;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = require("@anthropic-ai/sdk");
        const client = new Anthropic();

        const message = await client.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: base64Image,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this food/meal photo and identify all visible food items with their estimated nutritional values.

Return a JSON object with this exact structure:
{
  "meal_name": "Brief description of the overall meal",
  "confidence": "high" | "medium" | "low",
  "items": [
    {
      "name": "Food item name",
      "estimated_portion": "e.g. 1 cup, 150g, 1 medium piece",
      "serving_size": number (in grams),
      "serving_unit": "g",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fiber_g": number,
      "sugar_g": number
    }
  ],
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "tips": "Optional brief nutrition tip about this meal"
}

Be as accurate as possible with portion estimates based on visual cues. If you cannot identify the food clearly, set confidence to "low".

Return ONLY valid JSON, no markdown or extra text.`,
                },
              ],
            },
          ],
        });

        const text = message.content[0].text.trim();
        const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        analysis = JSON.parse(cleaned);
      } catch (aiErr) {
        console.error("[nutrition] AI analysis error:", aiErr.message);
        return res.status(500).json({ error: "AI analysis failed. Please try again or log manually." });
      }
    } else {
      return res.status(503).json({ error: "AI analysis is not configured. Please set ANTHROPIC_API_KEY." });
    }

    res.json(analysis);
  } catch (err) {
    next(err);
  }
}

// ─── Barcode Lookup ─────────────────────────────────────────

async function lookupBarcode(req, res, next) {
  try {
    const { barcode } = req.params;
    if (!barcode) {
      return res.status(400).json({ error: "Barcode is required" });
    }

    // First check local database
    const db = getDb();
    const localItem = db.prepare("SELECT * FROM food_items WHERE barcode = ?").get(barcode);
    if (localItem) {
      return res.json({ source: "local", item: localItem });
    }

    // Query Open Food Facts API
    const https = require("https");
    const data = await new Promise((resolve, reject) => {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
      https.get(url, { headers: { "User-Agent": "FitTracker/1.0" } }, (response) => {
        let body = "";
        response.on("data", (chunk) => { body += chunk; });
        response.on("end", () => {
          try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid API response")); }
        });
        response.on("error", reject);
      }).on("error", reject);
    });

    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: "Product not found for this barcode" });
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    const item = {
      name: p.product_name || p.product_name_en || "Unknown Product",
      brand: p.brands || null,
      serving_size: nutriments.serving_size ? parseFloat(nutriments.serving_size) || 100 : 100,
      serving_unit: "g",
      calories: Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal_serving"] || 0),
      protein_g: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
      carbs_g: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
      fat_g: Math.round((nutriments.fat_100g || 0) * 10) / 10,
      fiber_g: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
      sugar_g: Math.round((nutriments.sugars_100g || 0) * 10) / 10,
      sodium_mg: Math.round((nutriments.sodium_100g || 0) * 1000 * 10) / 10,
      barcode: barcode,
      photo_url: p.image_url || null,
      source: "openfoodfacts",
    };

    // Save to local database for future lookups
    try {
      db.prepare(
        `INSERT OR IGNORE INTO food_items (name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, barcode, photo_url, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      ).run(item.name, item.brand, item.serving_size, item.serving_unit, item.calories, item.protein_g, item.carbs_g, item.fat_g, item.fiber_g, item.sugar_g, item.sodium_mg, item.barcode, item.photo_url);

      const saved = db.prepare("SELECT * FROM food_items WHERE barcode = ?").get(barcode);
      if (saved) item.id = saved.id;
    } catch (saveErr) {
      console.error("[nutrition] Failed to save barcode item:", saveErr.message);
    }

    res.json({ source: "openfoodfacts", item });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  searchFoods, getFoodById, createFood, updateFood,
  listPresets, createPreset, deletePreset,
  logMeal, getMealsByDate, deleteMeal, dailySummary,
  setNutritionTargets, analyzeMealPhoto, lookupBarcode,
};
