import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken, setRefreshToken, loadToken, clearTokens } from "../lib/api";
import { connectWebSocket, disconnectWebSocket } from "../lib/websocket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          const data = await api("/users/me");
          setUser(data.user || data);
          connectWebSocket();
        }
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
      noAuth: true,
    });
    console.log("[auth] Login response keys:", Object.keys(data));
    console.log("[auth] data.user:", JSON.stringify(data.user));
    await setToken(data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    // Handle both { user: {...} } and flat { email, role, token } response formats
    const u = data.user || { id: data.id, email: data.email, first_name: data.first_name, last_name: data.last_name, role: data.role };
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (fields) => {
    // Determine endpoint based on whether this is an invitation acceptance
    const isInvitation = fields._acceptInvitation;
    const endpoint = isInvitation ? "/auth/invitations/accept" : "/auth/register";

    // Remove internal flag before sending
    const { _acceptInvitation, ...body } = fields;

    const data = await api(endpoint, {
      method: "POST",
      body,
      noAuth: true,
    });
    await setToken(data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api("/users/me");
      const u = data.user || data;
      setUser(u);
      return u;
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    disconnectWebSocket();
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
