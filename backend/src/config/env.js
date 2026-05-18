const isProd = process.env.NODE_ENV === "production";

export function getFrontendOrigins() {
  const fromEnv = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const devDefaults = ["http://localhost:5173", "http://127.0.0.1:5173"];

  if (isProd) return fromEnv;

  return [...new Set([...fromEnv, ...devDefaults])];
}

export function assertProductionEnv() {
  if (!isProd) return;

  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.FRONTEND_URL) missing.push("FRONTEND_URL");
  if (process.env.AUTH_DISABLED === "true") {
    console.warn("[env] AUTH_DISABLED=true en producción — desactivá esto para usuarios reales.");
  }
  const hasFirebase =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!hasFirebase && process.env.AUTH_DISABLED !== "true") {
    missing.push("FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_PATH");
  }

  if (missing.length) {
    console.error("[env] Variables obligatorias en producción:", missing.join(", "));
    process.exit(1);
  }
}
