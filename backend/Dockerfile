# API Express — usar si en Railway/Render el Root Directory es "backend"
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl wget

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY scripts ./scripts/

RUN chmod +x scripts/start-prod.sh && npx prisma generate

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3001}/health" | grep -q '"ok":true' || exit 1

CMD ["sh", "scripts/start-prod.sh"]
