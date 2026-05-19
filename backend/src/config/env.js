const isProd = process.env.NODE_ENV === "production";

function normalizeOrigin(url) {
  return url.replace(/\/+$/, "");
}

export function getFrontendOrigins() {
  const fromEnv = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean);

  const devDefaults = ["http://localhost:5173", "http://127.0.0.1:5173"];

  if (isProd) return fromEnv;

  return [...new Set([...fromEnv, ...devDefaults])];
}

/**
 * En producción solo advierte — no hace process.exit.
 * Un exit antes de listen() rompe el healthcheck de Railway.
 */
export function assertProductionEnv() {
  if (!isProd) return;

  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.FRONTEND_URL) missing.push("FRONTEND_URL");

  if (missing.length) {
    console.warn(
      "[env] Variables recomendadas en producción (faltan):",
      missing.join(", ")
    );
    console.warn("[env] El servidor arrancará; /health responderá ok. Configurá las variables en Railway.");
  }

  if (process.env.AUTH_DISABLED === "true") {
    console.warn("[env] AUTH_DISABLED=true en producción — desactivá esto para usuarios reales.");
  }

  const hasFirebase =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!hasFirebase && process.env.AUTH_DISABLED !== "true") {
    console.warn(
      "[env] Sin Firebase Admin: configurá FIREBASE_SERVICE_ACCOUNT_JSON en Railway para login en producción."
    );
  }
}
