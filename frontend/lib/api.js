const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ft_token");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ft_refresh");
}

export function setTokens(token, refreshToken) {
  localStorage.setItem("ft_token", token);
  if (refreshToken) localStorage.setItem("ft_refresh", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("ft_token");
  localStorage.removeItem("ft_refresh");
  localStorage.removeItem("ft_user");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("ft_user"));
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem("ft_user", JSON.stringify(user));
}

export async function api(path, options = {}) {
  const { method = "GET", body, noAuth = false } = options;

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (!noAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !noAuth) {
    // Try refresh
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const rRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (rRes.ok) {
          const rText = await rRes.text();
          const rData = JSON.parse(rText);
          setTokens(rData.token, rData.refreshToken);
          headers.Authorization = `Bearer ${rData.token}`;
          const retry = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
          if (retry.status === 204) return null;
          const retryText = await retry.text();
          const retryData = JSON.parse(retryText);
          if (!retry.ok) throw new Error(retryData.error || "Request failed");
          return retryData;
        }
      } catch (refreshErr) {
        // Network error during refresh — don't clear tokens for transient failures
        console.warn("[api] Token refresh failed:", refreshErr.message);
      }
    }
    // Only clear tokens if refresh was attempted and definitely failed (not a network glitch)
    clearTokens();
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return null;

  // Read as text first, then parse — avoids cryptic JSON parse errors
  // when the server (or proxy) returns non-JSON (e.g. HTML error pages)
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON response — likely a proxy error or server outage
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
