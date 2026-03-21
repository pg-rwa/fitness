import * as SecureStore from "expo-secure-store";

const WS_URL = ("http://64.227.187.54:3080/api")
  .replace("/api", "")
  .replace("http://", "ws://")
  .replace("https://", "wss://");

let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const listeners = new Map();

export function onWebSocketMessage(type, callback) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(callback);
  return () => listeners.get(type)?.delete(callback);
}

function notifyListeners(type, data) {
  const cbs = listeners.get(type);
  if (cbs) cbs.forEach((cb) => cb(data));
  // Also notify wildcard listeners
  const wildcards = listeners.get("*");
  if (wildcards) wildcards.forEach((cb) => cb({ type, ...data }));
}

export async function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN) return;

  const token = await SecureStore.getItemAsync("token");
  if (!token) return;

  try {
    ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      reconnectAttempts = 0;
      notifyListeners("connected", {});
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        notifyListeners(msg.type || "message", msg);
      } catch {}
    };

    ws.onclose = () => {
      notifyListeners("disconnected", {});
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  clearTimeout(reconnectTimer);
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;
  reconnectTimer = setTimeout(connectWebSocket, delay);
}

export function disconnectWebSocket() {
  clearTimeout(reconnectTimer);
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent reconnect
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function isWebSocketConnected() {
  return ws?.readyState === WebSocket.OPEN;
}
