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
      if (
        !origin || 
        allowed.includes(origin) || 
        origin.startsWith("http://192.168.") || 
        origin.startsWith("http://172.") || 
        origin.startsWith("http://10.")
      ) {
        callback(null, true);
        return;
      }

      if (origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }

      console.warn(`[cors] bloqueado: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-business-id", "x-mock-role", "X-Requested-With", "x-finance-bypass-token"],
    optionsSuccessStatus: 204,
  };
}