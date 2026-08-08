import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const logData = {
      requestId: req.headers["x-request-id"] || null,
      businessId: req.businessId || req.tenantId || null,
      userId: req.user?.uid || req.userId || null,
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, "HTTP Request Error");
    } else if (res.statusCode >= 400) {
      logger.warn(logData, "HTTP Request Warning");
    } else {
      logger.info(logData, "HTTP Request");
    }
  });

  next();
}
