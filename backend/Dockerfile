# Railway: Root Directory = "backend" · Dockerfile path = Dockerfile
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

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
