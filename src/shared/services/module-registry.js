const fs = require("fs");
const path = require("path");

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(name, mod) {
    this.modules.set(name, mod);
  }

  loadAll(modulesDir, app, deps) {
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;

      if (deps.features && !deps.features.isEnabled(name)) {
        continue;
      }

      const indexPath = path.join(modulesDir, name, "index.js");
      if (!fs.existsSync(indexPath)) continue;

      const mod = require(indexPath);
      if (typeof mod.register === "function") {
        mod.register(app, deps);
        this.register(name, mod);
      }
    }
  }

  get(name) {
    return this.modules.get(name);
  }

  list() {
    return Array.from(this.modules.keys());
  }
}

module.exports = { ModuleRegistry };
