import axios from "axios";

function normalizeBaseUrl(url) {
  // Runtime smart override: force Render API when running on Vercel production
  if (
    typeof window !== "undefined" && 
    !window.location.hostname.includes("localhost") && 
    !window.location.hostname.includes("127.0.0.1") && 
    !window.location.hostname.startsWith("192.168.") &&
    !window.location.hostname.startsWith("172.") &&
    !window.location.hostname.startsWith("10.")
  ) {
    return "https://dashboard-api-r6j9.onrender.com/api";
  }
  
  let base = (url || "http://localhost:3001/api").trim();
  
  // Si estamos en un dispositivo de la red local y accedemos por IP, redirigimos las peticiones del API a esa misma IP en el puerto 3001
  if (typeof window !== "undefined" && (
    window.location.hostname.startsWith("192.168.") || 
    window.location.hostname.startsWith("172.") || 
    window.location.hostname.startsWith("10.")
  )) {
    base = `http://${window.location.hostname}:3001/api`;
  }
  
  return base.replace(/\/+$/, "");
}

/** Base URL del API (incluye `/api`). Configurar con `VITE_API_URL` en producción. */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

let errorListener = null;

export function setErrorListener(listener) {
  errorListener = listener;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo disparar el listener de error global para errores de red o errores de servidor (status >= 500)
    // Se excluyen los códigos de error 4xx (400, 401, 403, 404, 409) que deben manejarse localmente
    const status = error.response?.status;
    const method = error.config?.method?.toLowerCase() || "";
    const isAllowedMethod = ["get", "post", "put"].includes(method);
    const isSystemError = !status || status >= 500;
    if (isSystemError && isAllowedMethod && errorListener) {
      errorListener(error);
    }
    return Promise.reject(error);
  }
);

/** Indica si la petición va al backend de la app (para interceptores de auth). */
export function isApiRequest(url) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    const requestUrl = new URL(url, API_BASE_URL);
    const baseUrl = new URL(API_BASE_URL);
    return requestUrl.origin === baseUrl.origin;
  } catch {
    return false;
  }
}

export default api;
