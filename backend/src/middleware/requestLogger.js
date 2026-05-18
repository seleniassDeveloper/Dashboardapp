export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
    if (level === "error") console.error("[http]", line);
    else if (level === "warn") console.warn("[http]", line);
    else console.log("[http]", line);
  });

  next();
}
