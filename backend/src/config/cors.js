import { getFrontendOrigins } from "./env.js";

export function getCorsOptions() {
  const isProd = process.env.NODE_ENV === "production";

  const allowed = [
    ...getFrontendOrigins(),
    "https://auradash.digital",
    "https://www.auradash.digital",
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

      // Rangos de IP privada únicamente permitidos en entorno de desarrollo local
      if (!isProd) {
        if (
          origin.startsWith("http://192.168.") ||
          origin.startsWith("http://172.") ||
          origin.startsWith("http://10.") ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          callback(null, true);
          return;
        }
      }

      console.warn(`[cors] bloqueado: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-business-id",
      "x-mock-role",
      "X-Requested-With",
      "x-finance-bypass-token",
      "stripe-signature"
    ],
    optionsSuccessStatus: 204,
  };
}