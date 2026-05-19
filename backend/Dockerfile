# API Express — Railway con Root Directory = "backend"
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY scripts ./scripts/

RUN chmod +x scripts/start-prod.sh && npx prisma generate

EXPOSE 3001

CMD ["sh", "scripts/start-prod.sh"]
