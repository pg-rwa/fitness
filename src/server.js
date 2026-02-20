const http = require("http");
const app = require("./app");
const { wsManager } = require("./shared/services/websocket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
wsManager.attach(server);

server.listen(PORT, () => {
  console.log(`Fitness API running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
