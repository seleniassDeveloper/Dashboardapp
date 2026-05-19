#!/bin/sh
set -e

echo "[start-prod] NODE_ENV=${NODE_ENV:-?} PORT=${PORT:-3001} HOST=${HOST:-0.0.0.0}"

echo "[start-prod] prisma migrate deploy…"
npx prisma migrate deploy

echo "[start-prod] starting API…"
exec node src/server.js
