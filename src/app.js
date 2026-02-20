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
const { requestLogger } = require("./shared/middleware/request-logger");
const { metrics } = require("./shared/services/metrics");

initDb();

const features = new FeatureFlags();
const registry = new ModuleRegistry();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Request logging & metrics (before routes)
app.use(requestLogger);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting on all API routes
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  const { wsManager } = require("./shared/services/websocket");
  res.json({
    status: "ok",
    version: require("../package.json").version,
    uptime: Math.floor(process.uptime()),
    modules: registry.list(),
    wsClients: wsManager.getOnlineCount(),
    memory: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

registry.loadAll(path.join(__dirname, "modules"), app, { features, eventBus });

// ─── Admin metrics endpoint ──────────────────────────────────────
const { authenticate } = require("./shared/middleware/authenticate");
const { authorize } = require("./shared/middleware/authorize");

app.get("/api/admin/metrics", authenticate, authorize("admin"), (_req, res) => {
  const { wsManager } = require("./shared/services/websocket");
  const snapshot = metrics.snapshot();
  snapshot.websocket = {
    online: wsManager.getOnlineCount(),
  };
  res.json(snapshot);
});

app.use(errorHandler);

module.exports = app;
