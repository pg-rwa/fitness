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
const { apiLimiter } = require("./shared/middleware/rate-limit");

initDb();

const features = new FeatureFlags();
const registry = new ModuleRegistry();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting on all API routes
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  const { wsManager } = require("./shared/services/websocket");
  res.json({
    status: "ok",
    modules: registry.list(),
    wsClients: wsManager.getOnlineCount(),
  });
});

registry.loadAll(path.join(__dirname, "modules"), app, { features, eventBus });

app.use(errorHandler);

module.exports = app;
