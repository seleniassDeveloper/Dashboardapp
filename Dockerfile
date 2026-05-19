# API Express — Railway/Render (Root Directory vacío en el monorepo)
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma/
COPY backend/src ./src/
COPY backend/scripts ./scripts/

RUN chmod +x scripts/start-prod.sh && npx prisma generate

# Railway inyecta PORT en runtime (suele ser distinto de 3001)
EXPOSE 3001

CMD ["sh", "scripts/start-prod.sh"]
