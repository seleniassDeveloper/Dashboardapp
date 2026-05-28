import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { API_BASE_URL, isApiRequest } from "../lib/api.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth, firebaseConfigOk } from "../firebase/client.js";
import i18n from "../i18n";

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "true";
const API_HOST = API_BASE_URL.replace(/\/api\/?$/, "");

const DEV_USER = {
  uid: "dev-user",
  email: "dev@example.com",
  displayName: "Dev User",
};

const AuthContext = createContext(null);

function firebaseErrorMessage(err) {
  const code = err?.code || "";
  const tt = (key, fallback) => i18n.t(`auth:errors.firebase.${key}`, { defaultValue: fallback });
  const map = {
    "auth/email-already-in-use": tt("emailInUse", "An account with that email already exists."),
    "auth/invalid-email": tt("invalidEmail", "The email is not valid."),
    "auth/weak-password": tt("weakPassword", "Password is too weak (use at least 6 characters)."),
    "auth/user-disabled": tt("userDisabled", "This account has been disabled."),
    "auth/user-not-found": tt("userNotFound", "There is no account with that email."),
    "auth/wrong-password": tt("wrongPassword", "Incorrect password."),
    "auth/invalid-credential": tt("invalidCredential", "Email or password are incorrect."),
    "auth/too-many-requests": tt("tooManyRequests", "Too many attempts. Try again later."),
    "auth/popup-closed-by-user": tt("popupClosed", "Google window was closed before completing."),
    "auth/popup-blocked": tt("popupBlocked", "The browser blocked the pop-up. Try again — we use automatic redirection."),
    "auth/redirect-cancelled-by-user": tt("redirectCancelled", "Google sign-in was cancelled."),
    "auth/unauthorized-domain": tt("unauthorizedDomain", "This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains."),
    "auth/network-request-failed": tt("networkRequestFailed", "Network error. Check your connection."),
    "auth/operation-not-allowed": tt("operationNotAllowed", "This sign-in method is not enabled in Firebase (check Authentication in the console)."),
    "auth/configuration": tt("configuration", "Firebase is not properly configured in the project (check the VITE_FIREBASE_* variables)."),
  };
  return map[code] || err?.message || tt("generic", "An authentication error occurred.");
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("https://www.googleapis.com/auth/gmail.send");
  provider.addScope("https://www.googleapis.com/auth/calendar.events");
  return provider;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(AUTH_DISABLED ? DEV_USER : null);
  const [authLoading, setAuthLoading] = useState(!AUTH_DISABLED);
  const [isAdmin, setIsAdmin] = useState(AUTH_DISABLED);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (AUTH_DISABLED) return;

    if (!firebaseConfigOk() || !firebaseAuth) {
      setAuthLoading(false);
      return;
    }

    let unsub = () => {};
    let cancelled = false;

    (async () => {
      try {
        await setPersistence(firebaseAuth, browserLocalPersistence);
        const result = await getRedirectResult(firebaseAuth);
        if (!cancelled && result?.user) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            localStorage.setItem("google_oauth_access_token", credential.accessToken);
          }
          setUser(result.user);
          setAuthError("");
        }
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
        if (cancelled) return;
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
    if (AUTH_DISABLED || !firebaseAuth) return;
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
    if (AUTH_DISABLED || !firebaseAuth) return;
    const reqId = api.interceptors.request.use(async (config) => {
      const url = String(config.url || "");
      console.log("Axios request:", url, "isApi:", isApiRequest(url));
      
      if (!isApiRequest(url)) return config;

      // Esperar a que auth esté listo
      if (firebaseAuth.authStateReady) {
        await firebaseAuth.authStateReady();
      }

      const u = firebaseAuth.currentUser;
      console.log("currentUser in interceptor:", u?.uid || "null");

      if (u) {
        const token = await u.getIdToken(true);
        console.log("sending token:", !!token);
        
        // Forzar asignación de header como solicitó el usuario
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log("No hay currentUser en interceptor. Se enviará request sin token.");
      }
      return config;
    });
    return () => api.interceptors.request.eject(reqId);
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    const resId = api.interceptors.response.use(
      (res) => res,
      (err) => {
        // No cerrar sesión automáticamente: en producción el API puede no estar
        // desplegado aún (localhost / 401) y eso expulsaba al usuario tras Google.
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(resId);
  }, []);

  const loginWithEmailPassword = useCallback(async (email, password) => {
    if (!firebaseAuth) throw new Error(i18n.t("auth:errors.firebaseNotConfigured", { defaultValue: "Firebase is not configured." }));
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }, []);

  const registerWithEmailPassword = useCallback(async ({ firstName, lastName, email, password }) => {
    if (!firebaseAuth) throw new Error(i18n.t("auth:errors.firebaseNotConfigured", { defaultValue: "Firebase is not configured." }));
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!firebaseAuth) throw new Error(i18n.t("auth:errors.firebaseNotConfigured", { defaultValue: "Firebase is not configured." }));
    setAuthError("");
    const provider = googleProvider();

    try {
      // Popup evita quedar colgado en firebaseapp.com/__/auth/handler (redirect).
      const result = await signInWithPopup(firebaseAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem("google_oauth_access_token", credential.accessToken);
      }
    } catch (err) {
      const code = err?.code || "";
      if (import.meta.env.DEV && (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user")) {
        throw new Error(
          "El navegador bloqueó la ventana de Google. Permití ventanas emergentes para localhost o activá VITE_AUTH_DISABLED=true en dashboard-react/.env."
        );
      }
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        sessionStorage.setItem("authRedirectPending", "1");
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }
      console.error("Google login error:", err);
      throw err;
    }
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    if (!firebaseAuth) throw new Error(i18n.t("auth:errors.firebaseNotConfigured", { defaultValue: "Firebase is not configured." }));
    await sendPasswordResetEmail(firebaseAuth, email.trim(), {
      url: window.location.origin,
      handleCodeInApp: false,
    });
  }, []);

  const logout = useCallback(async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
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
    throw new Error(i18n.t("auth:errors.useAuthOutsideProvider", { defaultValue: "useAuth must be used inside AuthProvider" }));
  }
  return ctx;
}
