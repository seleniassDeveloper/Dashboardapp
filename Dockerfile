# Railway: build del API desde la raíz del monorepo (carpeta backend/)
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

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
