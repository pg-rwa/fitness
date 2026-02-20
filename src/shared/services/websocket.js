const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config/auth");

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set<ws>
  }

  attach(server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url, "http://localhost");
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(4001, "Authentication required");
        return;
      }

      let userId;
      try {
        const payload = jwt.verify(token, jwtSecret);
        userId = payload.userId;
      } catch {
        ws.close(4001, "Invalid token");
        return;
      }

      // Register client
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      ws.on("close", () => {
        const userSockets = this.clients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) this.clients.delete(userId);
        }
      });

      ws.on("error", () => {
        ws.close();
      });

      // Send confirmation
      ws.send(JSON.stringify({ type: "connected", userId }));
    });

    return this.wss;
  }

  send(userId, event) {
    const sockets = this.clients.get(userId);
    if (!sockets) return;

    const message = JSON.stringify(event);
    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  }

  broadcast(event) {
    if (!this.wss) return;
    const message = JSON.stringify(event);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  getOnlineCount() {
    return this.clients.size;
  }
}

const wsManager = new WebSocketManager();

module.exports = { WebSocketManager, wsManager };
