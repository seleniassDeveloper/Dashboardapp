#!/usr/bin/env bash
# Sincroniza variables VITE_* del .env local al proyecto Vercel dashboard-react
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Falta dashboard-react/.env"
  exit 1
fi

echo "→ Proyecto: dashboard-react (production)"
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^VITE_ ]] || continue
  [[ "$line" =~ ^# ]] && continue
  name="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}"; val="${val#\"}"
  [[ -n "$val" ]] || continue
  printf '%s' "$val" | npx vercel@latest env add "$name" production --force
  echo "  ✓ $name"
done < .env

echo "Listo. Ejecutá: npx vercel@latest deploy --prod --yes"
