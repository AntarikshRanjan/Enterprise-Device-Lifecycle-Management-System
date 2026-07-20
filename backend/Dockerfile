# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copy Prisma schema first for caching
COPY prisma ./prisma/

RUN npx prisma generate

# Copy source code and build config
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Install production-only dependencies
RUN npm ci --only=production

# Copy built assets and schema from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Re-generate Prisma Client inside the production stage
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
