import { getFrontendOrigins } from "./env.js";

export function getCorsOptions() {
  const allowed = getFrontendOrigins();

  if (!allowed.length) {
    return { origin: true, credentials: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido (${origin})`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}
