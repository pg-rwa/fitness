const defaults = {
  auth: true,
  users: true,
  exercises: true,
  workouts: true,
  goals: true,
  "custom-fields": true,
  equipment: true,
  "workout-templates": true,
  "workout-sessions": true,
  "assigned-workouts": true,
  scheduling: true,
  nutrition: true,
  progress: true,
  calendar: true,
  "health-sync": true,
  "ai-insights": true,
  notifications: true,
  admin: true,
};

class FeatureFlags {
  constructor() {
    this.flags = { ...defaults };
    for (const [key, defaultVal] of Object.entries(defaults)) {
      const envKey = `FEATURE_${key.toUpperCase().replace(/-/g, "_")}`;
      if (process.env[envKey] !== undefined) {
        this.flags[key] = process.env[envKey] === "true";
      } else {
        this.flags[key] = defaultVal;
      }
    }
  }

  isEnabled(name) {
    return this.flags[name] !== false;
  }

  enable(name) {
    this.flags[name] = true;
  }

  disable(name) {
    this.flags[name] = false;
  }

  getAll() {
    return { ...this.flags };
  }
}

module.exports = { FeatureFlags };
