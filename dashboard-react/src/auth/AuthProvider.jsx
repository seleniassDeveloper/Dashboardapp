import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { API_BASE_URL, isApiRequest } from "../lib/api.js";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  collection,
  where,
  getDocs
} from "firebase/firestore";
import { firebaseAuth, firebaseConfigOk, firestoreDb } from "../firebase/client.js";
import i18n from "../i18n";

const API_HOST = API_BASE_URL.replace(/\/api\/?$/, "");
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "true";

const DEV_OWNER_PERMISSIONS = [
  "view_finances",
  "manage_settings",
  "manage_users",
  "appointments.view",
  "clients.view",
  "services.view",
  "team.view",
  "inventory.view",
  "sheets.view",
  "workflows.view",
  "automations.view",
];

function applyLocalDevSession(setters) {
  const { setRole, setPermissions, setIsUnauthorized, setBusiness, setFirestoreError } = setters;
  setRole("owner");
  setPermissions(DEV_OWNER_PERMISSIONS);
  setIsUnauthorized(false);
  setFirestoreError("");
  setBusiness({ id: "business-default", name: "Aura Studio" });
  localStorage.setItem("active_business_id", "business-default");
}

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
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [firestoreError, setFirestoreError] = useState("");

  const [financeUnlocked, setFinanceUnlocked] = useState(() => {
    return typeof sessionStorage !== "undefined" && !!sessionStorage.getItem("finance_bypass_token");
  });

  const unlockFinance = useCallback((token) => {
    sessionStorage.setItem("finance_bypass_token", token);
    setFinanceUnlocked(true);
  }, []);

  const lockFinance = useCallback(() => {
    sessionStorage.removeItem("finance_bypass_token");
    setFinanceUnlocked(false);
  }, []);

  const [userBusinesses, setUserBusinesses] = useState([]);

  const switchBusiness = useCallback(async (businessId) => {
    localStorage.setItem("active_business_id", businessId);
    try {
      const bizRes = await api.get("/appointments/business");
      if (bizRes.data) {
        setBusiness(bizRes.data);
      }
    } catch (err) {
      console.error("Error switching business:", err);
    }
  }, []);

  useEffect(() => {
    if (role) {
      api.get("/me/businesses")
        .then(res => {
          const list = res.data?.userBusinesses || [];
          setUserBusinesses(list);
        })
        .catch(err => {
          console.error("Error fetching user businesses:", err);
        });
    } else {
      setUserBusinesses([]);
    }
  }, [role]);


  // Fetch session details from Firestore and perform Owner auto-seeding
  const fetchSession = useCallback(async (firebaseUser = firebaseAuth?.currentUser) => {
    console.group("🔥 [Aura Firebase Diagnostic]");
    if (!firebaseUser) {
      console.warn("[Diagnostic] 1. No authenticated Google user found.");
      setFirestoreError("No se recibió información del usuario autenticado.");
      console.groupEnd();
      return;
    }
    console.log("[Diagnostic] 1. Active Google User:", firebaseUser.email, `(UID: ${firebaseUser.uid})`);

    if (AUTH_DISABLED) {
      console.log("[Diagnostic] VITE_AUTH_DISABLED=true — bypass local de autorización Firestore.");
      applyLocalDevSession({ setRole, setPermissions, setIsUnauthorized, setBusiness, setFirestoreError });
      console.groupEnd();
      return;
    }

    if (!firestoreDb) {
      console.error("[Diagnostic] 2. Firestore client is NOT initialized.");
      setFirestoreError("Error de inicialización: Firestore no está disponible en el cliente Firebase. Revisa las variables en el archivo .env.");
      console.groupEnd();
      return;
    }
    console.log("[Diagnostic] 2. Firestore is initialized successfully.");

    try {
      setFirestoreError("");
      const email = String(firebaseUser.email || "").trim().toLowerCase();
      if (!email) {
        console.error("[Diagnostic] Email is empty.");
        setFirestoreError("El usuario de Google no tiene una dirección de correo válida.");
        console.groupEnd();
        return;
      }

      // Check direct Document references in Firestore
      const uidRef = doc(firestoreDb, "users", firebaseUser.uid);
      const emailRef = doc(firestoreDb, "users", email);

      console.log("[Diagnostic] 3. Querying users collection by document ID...");
      let snap = await getDoc(uidRef);
      let data = null;
      let docId = firebaseUser.uid;

      if (!snap.exists()) {
        console.log(`[Diagnostic] Document under Firebase UID '${firebaseUser.uid}' not found. Trying Email ID '${email}'...`);
        snap = await getDoc(emailRef);
        if (snap.exists()) {
          data = snap.data();
          docId = email;
          console.log("[Diagnostic] Document found under Email ID!");
        } else {
          console.log("[Diagnostic] Document under Email ID not found either. Performing field query filter by email...");
          const q = query(collection(firestoreDb, "users"), where("email", "==", email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            snap = querySnapshot.docs[0];
            data = snap.data();
            docId = snap.id;
            console.log("[Diagnostic] Document found via field query!");
          }
        }
      } else {
        data = snap.data();
        console.log("[Diagnostic] Document found directly under Firebase UID!");
      }

      // 3. If user doesn't exist in Firestore, auto-create it now!
      if (!data) {
        console.log(`[Diagnostic] User '${email}' does NOT exist in Firestore. Initiating auto-creation...`);
        
        const defaultRole = "owner";
        const defaultPermissions = [
          "view_finances",
          "manage_settings",
          "manage_users",
          "appointments.view",
          "clients.view",
          "services.view",
          "team.view",
          "inventory.view",
          "sheets.view",
          "workflows.view",
          "automations.view"
        ];

        const newUserDoc = {
          uid: firebaseUser.uid,
          email: email,
          displayName: firebaseUser.displayName || "Usuario SaaS",
          role: defaultRole,
          permissions: defaultPermissions,
          active: true, // Let anyone see and test the system immediately
          createdAt: new Date(),
          lastAccess: new Date()
        };

        console.log(`[Diagnostic] Writing new user document directly under Firebase UID '${firebaseUser.uid}'...`);
        const uidDocRef = doc(firestoreDb, "users", firebaseUser.uid);
        await setDoc(uidDocRef, newUserDoc);
        
        data = newUserDoc;
        docId = firebaseUser.uid;
        console.log("[Diagnostic] User successfully auto-created in Firestore!");
      }

      if (data) {
        console.log("[Diagnostic] 4. User data loaded successfully:", data);
        console.log(`[Diagnostic] Active status: ${data.active}, Role: ${data.role}`);

        if (data.active === true) {
          // If the document ID was not the Firebase UID, migrate it now
          if (docId !== firebaseUser.uid) {
            console.log(`[Diagnostic] Migrating document ID from '${docId}' to Firebase UID '${firebaseUser.uid}'...`);
            const newUidRef = doc(firestoreDb, "users", firebaseUser.uid);
            await setDoc(newUidRef, {
              ...data,
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || data.displayName || "",
              lastAccess: new Date()
            });
            const oldRef = doc(firestoreDb, "users", docId);
            await deleteDoc(oldRef);
            console.log("[Diagnostic] Migration finished.");
          } else {
            console.log("[Diagnostic] Updating lastAccess timestamp in Firestore...");
            const activeRef = doc(firestoreDb, "users", firebaseUser.uid);
            await updateDoc(activeRef, {
              uid: firebaseUser.uid,
              lastAccess: new Date(),
              displayName: firebaseUser.displayName || data.displayName || ""
            });
          }

          setRole(data.role);
          setPermissions(data.permissions || []);
          setIsUnauthorized(false);
          
          const isDemo = localStorage.getItem("auradash_demo_session") === "true";
          if (AUTH_DISABLED || isDemo) {
            setBusiness({ id: "business-default", name: "Aura Studio" });
            localStorage.setItem("active_business_id", "business-default");
          } else {
            setBusiness(null);
          }
          console.log("[Diagnostic] 5. Session successfully authorized. Role:", data.role, "Permissions:", data.permissions);
        } else {
          console.warn("[Diagnostic] User exists but is set as INACTIVE.");
          setRole(null);
          setPermissions([]);
          setIsUnauthorized(true);
        }
      } else {
        console.warn("[Diagnostic] Failure loading user data.");
        setRole(null);
        setPermissions([]);
        setIsUnauthorized(true);
      }
    } catch (err) {
      console.error("[Diagnostic] Exception occurred during session sync:", err);
      
      const email = String(firebaseUser.email || "").trim().toLowerCase();
      if (email === "seleniadeveloper@gmail.com") {
        console.warn("[Diagnostic] Firestore falló para el Owner. Habilitando bypass local de desarrollo.");
        setRole("owner");
        setPermissions([
          "view_finances",
          "manage_settings",
          "manage_users",
          "appointments.view",
          "clients.view",
          "services.view",
          "team.view",
          "inventory.view",
          "sheets.view",
          "workflows.view",
          "automations.view"
        ]);
        setIsUnauthorized(false);
        setFirestoreError("");
        setBusiness({ id: "business-default", name: "Aura Studio" });
        localStorage.setItem("active_business_id", "business-default");
        console.groupEnd();
        return;
      }
      
      setFirestoreError(String(err?.message || err));
    } finally {
      console.groupEnd();
    }
  }, []);

  useEffect(() => {
    // Check if there is an active demo session first
    const isDemo = localStorage.getItem("auradash_demo_session") === "true";
    if (isDemo) {
      setUser({ email: "demo@auradash.digital", displayName: "Usuario Demo", uid: "quick-booking-user" });
      setRole("owner");
      setPermissions(DEV_OWNER_PERMISSIONS);
      setIsUnauthorized(false);
      setBusiness({ id: "business-default", name: "Aura Studio (Demo)" });
      setAuthLoading(false);
      return;
    }

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
          setUser(result.user);
          setAuthError("");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Google redirect error:", err);
          setAuthError(firebaseErrorMessage(err));
        }
      }

      if (cancelled) return;

      unsub = onAuthStateChanged(firebaseAuth, async (u) => {
        if (cancelled) return;
        setUser(u);
        if (u) {
          try {
            const tokenResult = await u.getIdTokenResult();
            const email = String(u.email || "").toLowerCase().trim();
            setIsSuperAdmin(!!tokenResult.claims?.admin || email === "seleniadeveloper@gmail.com");
          } catch (e) {
            console.error("Error fetching custom claims:", e);
            const email = String(u.email || "").toLowerCase().trim();
            setIsSuperAdmin(email === "seleniadeveloper@gmail.com");
          }
          setAuthError("");
          try {
            await fetchSession(u);
            
            const isDemo = localStorage.getItem("auradash_demo_session") === "true";
            if (!AUTH_DISABLED && !isDemo) {
              try {
                const res = await api.get("/me/businesses");
                const list = res.data?.userBusinesses || [];
                setUserBusinesses(list);

                if (list.length > 0) {
                  const activeBId = localStorage.getItem("active_business_id");
                  const activeExists = list.some(b => b.id === activeBId);
                  const selectedId = activeExists ? activeBId : list[0].id;
                  
                  localStorage.setItem("active_business_id", selectedId);
                  
                  const bizRes = await api.get("/appointments/business");
                  if (bizRes.data) {
                    setBusiness(bizRes.data);
                  } else {
                    setBusiness(null);
                  }
                } else {
                  setBusiness(null);
                  localStorage.removeItem("active_business_id");
                }
              } catch (err) {
                console.error("Error loading businesses on auth state change:", err);
                setBusiness(null);
              }
            }
          } catch (_) {}
        } else {
          setBusiness(null);
          setRole(null);
          setPermissions([]);
          setIsUnauthorized(false);
          setFirestoreError("");
        }
        setAuthLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [fetchSession]);

  useEffect(() => {
    const reqId = api.interceptors.request.use(async (config) => {
      const url = String(config.url || "");
      if (!isApiRequest(url)) return config;

      const activeBId = localStorage.getItem("active_business_id") || "business-default";
      config.headers["x-business-id"] = activeBId;

      const financeBypassToken = sessionStorage.getItem("finance_bypass_token");
      if (financeBypassToken) {
        config.headers["x-finance-bypass-token"] = financeBypassToken;
      }

      // Check if we are in demo mode
      const isDemo = localStorage.getItem("auradash_demo_session") === "true";
      if (isDemo) {
        config.headers.Authorization = `Bearer aura-admin-token`;
        return config;
      }

      if (!firebaseAuth) return config;

      if (firebaseAuth.authStateReady) {
        await firebaseAuth.authStateReady();
      }

      const u = firebaseAuth.currentUser;
      if (u) {
        const token = await u.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(reqId);
  }, []);

  useEffect(() => {
    const activeBId = localStorage.getItem("active_business_id");
    if (role && !business && activeBId && activeBId !== "business-default") {
      api.get("/appointments/business")
        .then(res => {
          if (res.data) {
            setBusiness(res.data);
          }
        })
        .catch(err => {
          console.error("Error fetching business config from backend:", err);
        });
    }
  }, [role, business]);

  // No-op compatibility helpers
  const loginWithEmailPassword = useCallback(async () => {}, []);
  const registerWithEmailPassword = useCallback(async () => {}, []);
  const sendPasswordReset = useCallback(async () => {}, []);

  const loginDemo = useCallback(() => {
    localStorage.setItem("auradash_demo_session", "true");
    setUser({ email: "demo@auradash.digital", displayName: "Usuario Demo", uid: "quick-booking-user" });
    setRole("owner");
    setPermissions(DEV_OWNER_PERMISSIONS);
    setIsUnauthorized(false);
    setBusiness({ id: "business-default", name: "Aura Studio (Demo)" });
    setAuthLoading(false);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!firebaseAuth) throw new Error(i18n.t("auth:errors.firebaseNotConfigured", { defaultValue: "Firebase is not configured." }));
    setAuthError("");
    const provider = googleProvider();

    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      setUser(result.user);
      await fetchSession(result.user);
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        sessionStorage.setItem("authRedirectPending", "1");
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }
      console.error("Google login error:", err);
      throw err;
    }
  }, [fetchSession]);

  const logout = useCallback(async () => {
    localStorage.removeItem("auradash_demo_session");
    localStorage.removeItem("authToken");
    localStorage.removeItem("active_business_id");
    sessionStorage.removeItem("finance_bypass_token");
    setFinanceUnlocked(false);
    setUser(null);
    setBusiness(null);
    setRole(null);
    setPermissions([]);
    setIsSuperAdmin(false);
    setIsUnauthorized(false);
    setFirestoreError("");
    if (firebaseAuth) await signOut(firebaseAuth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAdmin: role === "owner",
      isSuperAdmin,
      authDisabled: AUTH_DISABLED,
      authError,
      clearAuthError: () => setAuthError(""),
      firebaseConfigOk: firebaseConfigOk(),
      loginWithEmailPassword,
      registerWithEmailPassword,
      loginWithGoogle,
      sendPasswordReset,
      logout,
      firebaseErrorMessage,
      apiHost: API_HOST,
      business,
      role,
      permissions,
      financeUnlocked,
      unlockFinance,
      lockFinance,
      switchBusiness,
      loginDemo,
    }),
    [
      user,
      authLoading,
      role,
      authError,
      loginWithGoogle,
      logout,
      business,
      permissions,
      isUnauthorized,
      firestoreError,
      fetchSession,
      financeUnlocked,
      unlockFinance,
      lockFinance,
      userBusinesses,
      switchBusiness,
      loginDemo,
      isSuperAdmin,
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
