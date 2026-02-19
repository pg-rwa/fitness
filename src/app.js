require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { initDb } = require("./config/database");
const { FeatureFlags } = require("./config/features");
const { ModuleRegistry } = require("./shared/services/module-registry");
const { eventBus } = require("./shared/services/event-bus");
const { errorHandler } = require("./shared/middleware/error-handler");

initDb();

const features = new FeatureFlags();
const registry = new ModuleRegistry();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", modules: registry.list() });
});

registry.loadAll(path.join(__dirname, "modules"), app, { features, eventBus });

app.use(errorHandler);

module.exports = app;
