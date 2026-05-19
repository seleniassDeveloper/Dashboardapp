# API Express — monorepo (carpeta backend/). Usar en Railway/Render con Root Directory vacío.
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl wget

FROM base AS deps
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/
COPY backend/src ./src/
COPY backend/scripts ./scripts/

RUN chmod +x scripts/start-prod.sh && npx prisma generate

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3001}/health" | grep -q '"ok":true' || exit 1

CMD ["sh", "scripts/start-prod.sh"]
