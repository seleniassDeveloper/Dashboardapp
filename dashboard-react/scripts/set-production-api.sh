#!/usr/bin/env bash
# Uso: ./scripts/set-production-api.sh https://tu-api.up.railway.app
set -euo pipefail
cd "$(dirname "$0")/.."

API_URL="${1%/}/api"
if [[ -z "$API_URL" || "$API_URL" == "/api" ]]; then
  echo "Uso: $0 https://tu-backend.up.railway.app"
  exit 1
fi

echo "→ VITE_API_URL=$API_URL"
printf '%s' "$API_URL" | npx vercel@latest env add VITE_API_URL production --force
echo "→ Redeploy producción…"
npx vercel@latest deploy --prod --yes
echo "Listo. Probá: https://dashboard-react-rust-eight.vercel.app/app"
