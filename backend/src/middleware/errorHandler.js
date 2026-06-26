const isProd = process.env.NODE_ENV === "production";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Ruta no encontrada." });
}

export function errorHandler(err, req, res, _next) {
  if (err?.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: "Origen no permitido." });
  }

  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    if (isProd) {
      // En producción: solo loguear método, ruta y mensaje — sin stack ni datos internos
      console.error(`[api] ${status} ${req.method} ${req.path} - ${err.message}`);
    } else {
      console.error("[api]", err);
    }
  }

  const message =
    status < 500 && err.message
      ? err.message
      : "Error interno del servidor.";

  res.status(status).json({
    error: message,
    // detail solo en desarrollo: en producción nunca exponer internals al cliente
    ...(isProd ? {} : { detail: err.message || null }),
  });
}
