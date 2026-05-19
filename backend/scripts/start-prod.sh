#!/bin/sh
echo "=========================================="
echo "[start-prod] Starting server..."
echo "[start-prod] PORT=${PORT:-3001}"
echo "[start-prod] NODE_ENV=${NODE_ENV:-production}"
echo "=========================================="

# Migraciones en background — NO bloquean el healthcheck de Railway
if [ -n "${DATABASE_URL}" ]; then
  (
    echo "[start-prod] prisma migrate deploy (background)..."
    npx prisma migrate deploy && echo "[start-prod] migrations OK" || echo "[start-prod] migrations WARN"
  ) &
else
  echo "[start-prod] DATABASE_URL not set — skip migrations"
fi

echo "[start-prod] exec node src/server.js"
exec node src/server.js
