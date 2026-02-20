const http = require("http");
const app = require("./app");
const { wsManager } = require("./shared/services/websocket");
const { logger } = require("./shared/services/logger");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
wsManager.attach(server);

server.listen(PORT, () => {
  logger.info("Fitness API started", { port: PORT });
  logger.info("WebSocket server available", { path: `/ws` });
});

// Graceful shutdown
function shutdown(signal) {
  logger.info("Shutdown signal received", { signal });
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
