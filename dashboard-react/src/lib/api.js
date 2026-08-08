import axios from "axios";
import * as Sentry from "@sentry/react";

function normalizeBaseUrl(url) {
  if (url && url.trim()) {
    return url.trim().replace(/\/+$/, "");
  }

  // Fail-fast in production: require explicit VITE_API_URL
  if (import.meta.env.PROD) {
    throw new Error(
      "[Config Error] Falta VITE_API_URL. Configurala en las variables de entorno de Vercel."
    );
  }

  let base = "https://dashboard-api-r6j9.onrender.com/api";

  return base.replace(/\/+$/, "");
}

/** Base URL del API (incluye `/api`). Configurar con `VITE_API_URL` en producción. */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

let errorListener = null;

export function setErrorListener(listener) {
  errorListener = listener;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.skipGlobalErrorModal) {
      return Promise.reject(error);
    }
    // Solo disparar el listener de error global y Sentry para errores de red o servidor (status >= 500)
    const status = error.response?.status;
    const method = error.config?.method?.toLowerCase() || "";
    const isAllowedMethod = ["get", "post", "put", "patch", "delete"].includes(method);
    const isSystemError = !status || status >= 500;

    if (isSystemError && isAllowedMethod) {
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          extra: {
            method: error.config?.method,
            url: error.config?.url,
            status,
          },
        });
      }
      if (errorListener) {
        errorListener(error);
      }
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
