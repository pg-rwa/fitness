import * as SecureStore from "expo-secure-store";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://64.227.187.54:3080/api";
export const API_BASE = API_URL.replace("/api", "");

let accessToken = null;
let refreshPromise = null;

// Offline support integration - lazy loaded to avoid circular deps
let offlineModule = null;
function getOffline() {
  if (!offlineModule) {
    try { offlineModule = require("./offline"); } catch {}
  }
  return offlineModule;
}

export async function loadToken() {
  accessToken = await SecureStore.getItemAsync("token");
  return accessToken;
}

export async function setToken(token) {
  accessToken = token;
  if (token) {
    await SecureStore.setItemAsync("token", token);
  } else {
    await SecureStore.deleteItemAsync("token");
  }
}

export async function setRefreshToken(token) {
  if (token) {
    await SecureStore.setItemAsync("refreshToken", token);
  } else {
    await SecureStore.deleteItemAsync("refreshToken");
  }
}

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  await setToken(data.token);
  if (data.refreshToken) await setRefreshToken(data.refreshToken);
  return data.token;
}

export async function api(path, options = {}) {
  const { method = "GET", body, noAuth = false, cache: cacheKey } = options;

  const offline = getOffline();

  // If offline and it's a GET, try cache
  if (offline && !offline.getIsOnline() && method === "GET" && cacheKey) {
    const cached = await offline.getCachedResponse(cacheKey || path);
    if (cached) return cached;
  }

  const headers = { "Content-Type": "application/json" };
  if (!noAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // Network error - queue for retry if it's a write operation
    if (offline && method !== "GET") {
      await offline.queueRequest(path, { method, body });
      return { _queued: true, message: "Saved offline, will sync when connected" };
    }
    // For GETs, try cache
    if (offline && cacheKey) {
      const cached = await offline.getCachedResponse(cacheKey || path);
      if (cached) return cached;
    }
    throw new Error("No internet connection. Please check your network and try again.");
  }

  // Auto-refresh on 401
  if (res.status === 401 && !noAuth && !refreshPromise) {
    try {
      refreshPromise = refreshAccessToken();
      await refreshPromise;
      refreshPromise = null;

      headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      refreshPromise = null;
      throw new Error("AUTH_EXPIRED");
    }
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(`[api] Non-JSON response (${res.status}):`, text.slice(0, 200));
    throw new Error(
      res.status >= 500
        ? "Server is temporarily unavailable. Please try again."
        : `Unexpected response from server (${res.status}). Please try again.`
    );
  }
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);

  // Cache successful GET responses
  if (offline && method === "GET" && cacheKey) {
    offline.cacheResponse(cacheKey || path, data).catch(() => {});
  }

  return data;
}

export async function apiUpload(path, formData) {
  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (networkErr) {
    throw new Error("No internet connection. Please check your network and try again.");
  }

  if (res.status === 401 && !refreshPromise) {
    try {
      refreshPromise = refreshAccessToken();
      await refreshPromise;
      refreshPromise = null;
      headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: formData });
    } catch {
      refreshPromise = null;
      throw new Error("AUTH_EXPIRED");
    }
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Unexpected response from server (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function clearTokens() {
  accessToken = null;
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("refreshToken");
}
