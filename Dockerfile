# Railway: Root Directory = vacío · Dockerfile path = Dockerfile
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

RUN npx prisma generate

# Railway inyecta PORT en runtime (ej. 8080)
EXPOSE 8080

# Un solo proceso Node (evita doble start / EADDRINUSE)
CMD ["node", "src/server.js"]
