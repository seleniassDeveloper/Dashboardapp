import { getFrontendOrigins } from "./env.js";

export function getCorsOptions() {
  const allowed = [
    ...getFrontendOrigins(),
    "https://dashboardapp-psi.vercel.app",
    "https://dashboard-react-rust-eight.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

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