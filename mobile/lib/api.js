import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

let accessToken = null;
let refreshPromise = null;

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
  const { method = "GET", body, noAuth = false } = options;

  const headers = { "Content-Type": "application/json" };
  if (!noAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function clearTokens() {
  accessToken = null;
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("refreshToken");
}
