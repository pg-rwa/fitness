import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken, setRefreshToken, loadToken, clearTokens } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          const data = await api("/auth/me");
          setUser(data);
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
    await setToken(data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (fields) => {
    const data = await api("/auth/register", {
      method: "POST",
      body: fields,
      noAuth: true,
    });
    await setToken(data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
