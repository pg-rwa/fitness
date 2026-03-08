const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

export async function api(path, options = {}) {
  const { method = "GET", body, noAuth = false } = options;

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (!noAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !noAuth) {
    clearToken();
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
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
  return data;
}
