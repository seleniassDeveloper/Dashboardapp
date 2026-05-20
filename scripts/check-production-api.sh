#!/usr/bin/env bash
# Verifica que el API en Railway responda (sin CORS; curl directo).
set -euo pipefail

API_HOST="${1:-https://aplicacion-dashboard-production.up.railway.app}"

echo "→ GET $API_HOST/health"
code=$(curl -sS -o /tmp/health.json -w "%{http_code}" "$API_HOST/health" || echo "000")
echo "   HTTP $code"
if [[ "$code" == "200" ]]; then
  cat /tmp/health.json
  echo ""
  echo "OK: el backend está en línea."
  exit 0
fi

cat /tmp/health.json 2>/dev/null || true
echo ""
echo "ERROR: el backend no responde (502 = contenedor caído o variables mal en Railway)."
echo "Revisá en Railway → Deployments → Logs y estas variables:"
echo "  NODE_ENV=production"
echo "  DATABASE_URL=(Postgres)"
echo "  FRONTEND_URL=https://dashboard-react-rust-eight.vercel.app"
echo "  FIREBASE_SERVICE_ACCOUNT_JSON=(JSON minificado)"
exit 1
