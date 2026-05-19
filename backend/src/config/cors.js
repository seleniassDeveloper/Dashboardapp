import { getFrontendOrigins } from "./env.js";

export function getCorsOptions() {
  const allowed = getFrontendOrigins();

  if (!allowed.length) {
    console.warn("[cors] FRONTEND_URL vacío — permitiendo cualquier origen (solo para debug).");
    return { origin: true, credentials: true };
  }

  console.log("[cors] orígenes permitidos:", allowed.join(", "));

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`[cors] bloqueado: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };
}
