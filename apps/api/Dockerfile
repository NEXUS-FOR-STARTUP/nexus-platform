# =============================================================================
# Dockerfile — Nexus API (Hono + Prisma)
# Multi-stage: turbo prune → deps → build → runner
# Build: docker build -f apps/api/Dockerfile -t nexus-api:latest .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base
# -----------------------------------------------------------------------------
FROM node:24.18.0-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Turbo prune
# -----------------------------------------------------------------------------
FROM base AS turbo
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune nexus-platform-api --docker

# -----------------------------------------------------------------------------
# Stage 3: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
COPY --from=turbo /app/out/json/ .
COPY --from=turbo /app/out/package-lock.json ./package-lock.json
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 4: Build
# -----------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=turbo /app/out/full/ .
COPY --from=turbo /app/out/package-lock.json ./package-lock.json

# Copy Prisma schema + config from root (not captured by turbo prune for workspace deps)
COPY prisma/ ./prisma/
COPY prisma.config.ts ./prisma.config.ts

# Copy workspace-level node_modules (npm hoists only non-conflicting deps to root)
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Build the API (includes devDeps needed for prisma migrate in migrate service)
RUN npm run build --workspace=nexus-platform-api

# -----------------------------------------------------------------------------
# Stage 5: Runner
# -----------------------------------------------------------------------------
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexus && \
    mkdir -p /app/logs && \
    chown -R nexus:nodejs /app

USER nexus

# ── Stable layers (cached unless deps change) ──
# Root node_modules — copy from deps stage (cached when lockfile unchanged)
COPY --from=deps --chown=nexus:nodejs /app/node_modules ./node_modules
# Workspace-level node_modules (npm hoisting fails for conflicting deps: @ai-sdk/google, etc.)
COPY --from=deps --chown=nexus:nodejs /app/apps/api/node_modules ./apps/api/node_modules
# Shared packages needed at runtime (exports raw TS, referenced via symlink)
COPY --from=builder --chown=nexus:nodejs /app/packages ./packages
# Prisma schema + migrations + config for prisma migrate at runtime
COPY --from=builder --chown=nexus:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nexus:nodejs /app/prisma.config.ts ./prisma.config.ts

# ── Prisma generated client (generated during build; overlay from builder) ──
COPY --from=builder --chown=nexus:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nexus:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# ── Changing layers (rebuilt every source change) ──
# Compiled output — only this changes most builds
COPY --from=builder --chown=nexus:nodejs /app/apps/api/dist ./apps/api/dist
# Package.json for workspace context
COPY --from=builder --chown=nexus:nodejs /app/apps/api/package.json ./apps/api/package.json

EXPOSE 8000

ENV NODE_ENV=production
ENV LOG_LEVEL=info

CMD ["node", "apps/api/dist/index.js"]
