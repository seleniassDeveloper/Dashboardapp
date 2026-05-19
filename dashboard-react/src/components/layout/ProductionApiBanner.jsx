import { Alert } from "react-bootstrap";
import { API_BASE_URL } from "../../lib/api.js";

export default function ProductionApiBanner() {
  const isProd = import.meta.env.PROD;
  if (!isProd) return null;

  const isLocalApi =
    API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
  const missingApi = !import.meta.env.VITE_API_URL?.trim();

  if (!isLocalApi && !missingApi) return null;

  return (
    <Alert variant="warning" className="m-3 mb-0 small">
      {missingApi ? (
        <>
          <strong>Falta VITE_API_URL en Vercel.</strong> Agregá la URL del API (Railway/Render) con
          sufijo <code>/api</code> y redeploy.
        </>
      ) : (
        <>
          <strong>API en localhost en producción.</strong> Configurá <code>VITE_API_URL</code> con tu
          dominio Railway/Render.
        </>
      )}{" "}
      Ver <code>RAILWAY.md</code> o <code>RENDER.md</code>.
    </Alert>
  );
}
