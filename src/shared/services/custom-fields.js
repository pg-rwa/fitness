const { getDb } = require("../../config/database");
const { NotFoundError, ValidationError, ConflictError } = require("../utils/errors");

const VALID_FIELD_TYPES = ["text", "number", "date", "boolean", "select", "multiselect", "json"];

class CustomFieldsService {
  defineField({ entityType, name, fieldType, options, createdBy }) {
    if (!VALID_FIELD_TYPES.includes(fieldType)) {
      throw new ValidationError(`Invalid field type. Must be one of: ${VALID_FIELD_TYPES.join(", ")}`);
    }

    const db = getDb();
    try {
      const result = db
        .prepare(
          `INSERT INTO custom_field_definitions (entity_type, name, field_type, options, created_by)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(entityType, name, fieldType, JSON.stringify(options || {}), createdBy);

      return db.prepare("SELECT * FROM custom_field_definitions WHERE id = ?").get(result.lastInsertRowid);
    } catch (err) {
      if (err.message.includes("UNIQUE constraint")) {
        throw new ConflictError(`Field '${name}' already defined for ${entityType}`);
      }
      throw err;
    }
  }

  getDefinitions(entityType) {
    const db = getDb();
    return db
      .prepare("SELECT * FROM custom_field_definitions WHERE entity_type = ? AND is_active = 1 ORDER BY name")
      .all(entityType);
  }

  getDefinition(id) {
    const db = getDb();
    const def = db.prepare("SELECT * FROM custom_field_definitions WHERE id = ?").get(id);
    if (!def) throw new NotFoundError("Custom field definition");
    return def;
  }

  updateDefinition(id, updates) {
    const db = getDb();
    const def = this.getDefinition(id);

    const fields = [];
    const values = [];
    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.fieldType !== undefined) {
      if (!VALID_FIELD_TYPES.includes(updates.fieldType)) {
        throw new ValidationError(`Invalid field type`);
      }
      fields.push("field_type = ?");
      values.push(updates.fieldType);
    }
    if (updates.options !== undefined) {
      fields.push("options = ?");
      values.push(JSON.stringify(updates.options));
    }
    if (updates.isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) return def;

    values.push(id);
    db.prepare(`UPDATE custom_field_definitions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.getDefinition(id);
  }

  removeDefinition(id) {
    const db = getDb();
    this.getDefinition(id);
    db.prepare("DELETE FROM custom_field_values WHERE field_def_id = ?").run(id);
    db.prepare("DELETE FROM custom_field_definitions WHERE id = ?").run(id);
  }

  setValues(entityType, entityId, fieldValues) {
    const db = getDb();
    const results = [];

    const upsert = db.prepare(`
      INSERT INTO custom_field_values (entity_type, entity_id, field_def_id, value, recorded_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const deleteExisting = db.prepare(
      "DELETE FROM custom_field_values WHERE entity_type = ? AND entity_id = ? AND field_def_id = ?"
    );

    db.transaction(() => {
      for (const { fieldDefId, value } of fieldValues) {
        const def = db.prepare("SELECT * FROM custom_field_definitions WHERE id = ? AND is_active = 1").get(fieldDefId);
        if (!def) continue;
        if (def.entity_type !== entityType) continue;

        deleteExisting.run(entityType, entityId, fieldDefId);
        upsert.run(entityType, entityId, fieldDefId, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
    })();

    return this.getValues(entityType, entityId);
  }

  getValues(entityType, entityId) {
    const db = getDb();
    return db
      .prepare(
        `SELECT v.*, d.name as field_name, d.field_type
         FROM custom_field_values v
         JOIN custom_field_definitions d ON v.field_def_id = d.id
         WHERE v.entity_type = ? AND v.entity_id = ?
         ORDER BY d.name`
      )
      .all(entityType, entityId);
  }

  getValueHistory(entityType, entityId, fieldDefId) {
    const db = getDb();
    return db
      .prepare(
        `SELECT v.*, d.name as field_name, d.field_type
         FROM custom_field_values v
         JOIN custom_field_definitions d ON v.field_def_id = d.id
         WHERE v.entity_type = ? AND v.entity_id = ? AND v.field_def_id = ?
         ORDER BY v.recorded_at DESC`
      )
      .all(entityType, entityId, fieldDefId);
  }
}

const customFieldsService = new CustomFieldsService();

module.exports = { CustomFieldsService, customFieldsService };
