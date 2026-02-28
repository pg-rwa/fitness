"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, getRefreshToken, getUser, setUser, clearTokens } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const cached = getUser();
    if (cached) {
      setUserState(cached);
      setLoading(false);
    }
    api("/users/me")
      .then((data) => {
        const u = data.user || data;
        setUserState(u);
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        // Only clear auth if no token remains (api() already cleared on 401)
        if (!getToken()) {
          setUserState(null);
          setLoading(false);
        } else if (!cached) {
          // Token exists but no cached user and API failed — clear
          clearTokens();
          setUserState(null);
          setLoading(false);
        }
        // If cached user exists and token still present, keep using cache
      });
  }, []);

  const logout = async () => {
    const refresh = getRefreshToken();
    try {
      await api("/auth/logout", {
        method: "POST",
        body: { refreshToken: refresh },
      });
    } catch {}
    clearTokens();
    setUserState(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    const data = await api("/users/me");
    const u = data.user || data;
    setUserState(u);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
