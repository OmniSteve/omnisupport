// Standalone authentication context for Omni Support.
// Session validity is confirmed against the backend
// via GET /auth/me on startup — a cached user object is never trusted as proof
// of an active session.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "omni_token";
const USER_KEY = "omni_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate the stored token against the backend. The returned user is
    // authoritative; on failure the local session is cleared.
    authApi
      .me()
      .then((u) => {
        setUser(u);
        setIsAuthenticated(true);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
    return user;
  }, []);

  const logout = useCallback(async () => {
    // Notify the backend so it can revoke the session/refresh token, then clear
    // the local session regardless of whether the server call succeeds.
    try {
      await authApi.logout();
    } catch {
      /* ignore — always clear locally */
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}