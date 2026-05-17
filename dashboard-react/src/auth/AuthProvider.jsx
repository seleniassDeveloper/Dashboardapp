import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth, firebaseConfigOk } from "../firebase/client.js";

const API_HOST = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3001";
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "true";

const DEV_USER = {
  uid: "dev-user",
  email: "dev@example.com",
  displayName: "Usuario Dev",
};

const AuthContext = createContext(null);

function firebaseErrorMessage(err) {
  const code = err?.code || "";
  const map = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
    "auth/invalid-email": "El email no es válido.",
    "auth/weak-password": "La contraseña es demasiado débil (usá al menos 6 caracteres).",
    "auth/user-disabled": "Esta cuenta fue deshabilitada.",
    "auth/user-not-found": "No hay cuenta con ese email.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Probá más tarde.",
    "auth/popup-closed-by-user": "Ventana de Google cerrada antes de completar.",
    "auth/popup-blocked":
      "El navegador bloqueó la ventana emergente. Probá de nuevo: usamos redirección automática.",
    "auth/redirect-cancelled-by-user": "Inicio de sesión con Google cancelado.",
    "auth/unauthorized-domain":
      "Este dominio no está autorizado en Firebase. Agregá localhost en Authentication → Settings → Authorized domains.",
    "auth/network-request-failed": "Error de red. Revisá tu conexión.",
    "auth/operation-not-allowed":
      "Este método de acceso no está habilitado en Firebase (revisá Authentication en la consola).",
    "auth/configuration": "Firebase no está bien configurado en el proyecto (revisá las variables VITE_FIREBASE_*).",
  };
  return map[code] || err?.message || "Ocurrió un error de autenticación.";
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(AUTH_DISABLED ? DEV_USER : null);
  const [authLoading, setAuthLoading] = useState(!AUTH_DISABLED);
  const [isAdmin, setIsAdmin] = useState(AUTH_DISABLED);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (AUTH_DISABLED) return;

    let unsub = () => {};
    let cancelled = false;

    (async () => {
      try {
        await getRedirectResult(firebaseAuth);
      } catch (err) {
        if (!cancelled) {
          console.error("Google redirect error:", err);
          setAuthError(firebaseErrorMessage(err));
        }
      } finally {
        sessionStorage.removeItem("authRedirectPending");
      }

      if (cancelled) return;

      unsub = onAuthStateChanged(firebaseAuth, (u) => {
        setUser(u);
        setIsAdmin(false);
        setAuthLoading(false);
        if (u) setAuthError("");
      });
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    async function loadClaims() {
      if (!firebaseAuth.currentUser) return;
      try {
        const tokenResult = await firebaseAuth.currentUser.getIdTokenResult();
        setIsAdmin(tokenResult?.claims?.admin === true);
      } catch {
        setIsAdmin(false);
      }
    }
    if (user) loadClaims();
  }, [user]);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    const reqId = axios.interceptors.request.use(async (config) => {
      const url = String(config.url || "");
      if (!url.includes("localhost:3001")) return config;
      const u = firebaseAuth.currentUser;
      if (u) {
        const token = await u.getIdToken();
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(reqId);
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    const resId = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        if (err.response?.status === 401 && firebaseAuth.currentUser) {
          try {
            await signOut(firebaseAuth);
          } catch {
            /* ignore */
          }
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(resId);
  }, []);

  const loginWithEmailPassword = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }, []);

  const registerWithEmailPassword = useCallback(async ({ firstName, lastName, email, password }) => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthError("");
    const provider = googleProvider();

    try {
      sessionStorage.setItem("authRedirectPending", "1");
      await signInWithRedirect(firebaseAuth, provider);
    } catch (err) {
      sessionStorage.removeItem("authRedirectPending");
      console.error("Google login error:", err);
      throw err;
    }
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    await sendPasswordResetEmail(firebaseAuth, email.trim(), {
      url: window.location.origin,
      handleCodeInApp: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAdmin,
      authDisabled: AUTH_DISABLED,
      authError,
      clearAuthError: () => setAuthError(""),
      firebaseConfigOk: AUTH_DISABLED || firebaseConfigOk(),
      loginWithEmailPassword,
      registerWithEmailPassword,
      loginWithGoogle,
      sendPasswordReset,
      logout,
      firebaseErrorMessage,
      apiHost: API_HOST,
    }),
    [
      user,
      authLoading,
      isAdmin,
      authError,
      loginWithEmailPassword,
      registerWithEmailPassword,
      loginWithGoogle,
      sendPasswordReset,
      logout,
    ]
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
