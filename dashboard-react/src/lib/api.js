import axios from "axios";

function normalizeBaseUrl(url) {
  const base = (url || "http://localhost:3001/api").trim();
  return base.replace(/\/+$/, "");
}

/** Base URL del API (incluye `/api`). Configurar con `VITE_API_URL` en producción. */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

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
