#!/bin/sh
set -e

PORT="${PORT:-3001}"
echo "=========================================="
echo "[start-prod] Starting server..."
echo "[start-prod] NODE_ENV=${NODE_ENV:-production}"
echo "[start-prod] PORT=${PORT}"
echo "[start-prod] HOST=0.0.0.0"
echo "=========================================="

if [ -n "${DATABASE_URL}" ]; then
  echo "[start-prod] Running prisma migrate deploy..."
  if npx prisma migrate deploy; then
    echo "[start-prod] Migrations OK"
  else
    echo "[start-prod] WARNING: prisma migrate deploy failed — starting API anyway"
  fi
else
  echo "[start-prod] WARNING: DATABASE_URL not set — skipping migrations"
fi

echo "[start-prod] Launching node src/server.js"
exec node src/server.js
