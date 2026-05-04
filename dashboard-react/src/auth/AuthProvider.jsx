import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const TOKEN_KEY = "dashboard_auth_token";
const API = "http://localhost:3001/api";

function applyAxiosToken(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

function isPublicAuthUrl(url) {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/google")
  );
}

function readStoredToken() {
  const t = sessionStorage.getItem(TOKEN_KEY);
  applyAxiosToken(t);
  return t;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken());
  const setTokenRef = useRef(setToken);
  setTokenRef.current = setToken;

  const persistSession = useCallback((t) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    applyAxiosToken(t);
    setToken(t);
  }, []);

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = String(err.config?.url || "");
        if (err.response?.status === 401 && !isPublicAuthUrl(url)) {
          sessionStorage.removeItem(TOKEN_KEY);
          applyAxiosToken(null);
          setTokenRef.current(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const t = res.data?.token;
    if (!t || typeof t !== "string") {
      throw new Error("Respuesta inválida del servidor.");
    }
    persistSession(t);
  }, [persistSession]);

  const register = useCallback(
    async (payload) => {
      const res = await axios.post(`${API}/auth/register`, payload);
      const t = res.data?.token;
      if (!t || typeof t !== "string") {
        throw new Error("Respuesta inválida del servidor.");
      }
      persistSession(t);
    },
    [persistSession]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const res = await axios.post(`${API}/auth/google`, { idToken });
      const t = res.data?.token;
      if (!t || typeof t !== "string") {
        throw new Error("Respuesta inválida del servidor.");
      }
      persistSession(t);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    applyAxiosToken(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, login, register, loginWithGoogle, logout }),
    [token, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
