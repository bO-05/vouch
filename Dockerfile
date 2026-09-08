# syntax=docker/dockerfile:1
# Multi-stage production container for Vouch

# -------------------------------------------------------------
# Stage 1: Frontend & Backend Build
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy full source tree and compile Vite assets
COPY . .
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Runtime
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy dependency definitions and install only production dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# Copy server files, seed data, and built frontend with node ownership
COPY --chown=node:node server/ ./server/
COPY --chown=node:node --from=builder /app/dist ./dist

# Ensure writable runtime directory for database and audio cache
RUN mkdir -p /app/server/audio_cache && chown -R node:node /app

# Non-root secure user
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "server/index.js"]
