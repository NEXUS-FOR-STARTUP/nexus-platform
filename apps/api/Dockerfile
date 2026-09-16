# =============================================================================
# Dockerfile — Nexus API (Hono + Prisma)
# Multi-stage: turbo prune → deps → build → runner
# Build: docker build -f apps/api/Dockerfile -t nexus-api:latest .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base
# -----------------------------------------------------------------------------
FROM oven/bun:1.4.0-alpine AS base
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Turbo prune
# -----------------------------------------------------------------------------
FROM base AS turbo
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune nexus-platform-api --docker

# -----------------------------------------------------------------------------
# Stage 3: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
COPY --from=turbo /app/out/json/ .
RUN bun install --frozen-lockfile && mkdir -p /app/apps/api/node_modules

# -----------------------------------------------------------------------------
# Stage 4: Build
# -----------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=turbo /app/out/full/ .
COPY --from=turbo /app/out/bun.lock ./bun.lock

# Copy Prisma schema + config from root (not captured by turbo prune for workspace deps)
COPY prisma/ ./prisma/
COPY prisma.config.ts ./prisma.config.ts

# Copy workspace-level node_modules (ensured by mkdir -p in deps)
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Build the API (includes devDeps needed for prisma migrate in migrate service)
RUN bun run --filter nexus-platform-api build

# -----------------------------------------------------------------------------
# Stage 5: Runner
# -----------------------------------------------------------------------------
FROM oven/bun:1.4.0-alpine AS runner
WORKDIR /app
# Install Typst CLI for A4 PDF report generation
RUN apk add --no-cache typst


RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexus && \
    mkdir -p /app/logs && \
    chown -R nexus:nodejs /app

USER nexus

# ── Stable layers (cached unless deps change) ──
# Root node_modules — copy from deps stage (cached when lockfile unchanged)
COPY --from=deps --chown=nexus:nodejs /app/node_modules ./node_modules
# Workspace-level node_modules
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
# PDF templates & fonts for Typst runtime compilation
COPY --from=builder --chown=nexus:nodejs /app/apps/api/src/modules/reports/infrastructure/pdf/templates ./apps/api/dist/modules/reports/infrastructure/pdf/templates
COPY --from=builder --chown=nexus:nodejs /app/apps/api/src/modules/reports/infrastructure/pdf/fonts ./apps/api/dist/modules/reports/infrastructure/pdf/fonts
# Package.json for workspace context
COPY --from=builder --chown=nexus:nodejs /app/apps/api/package.json ./apps/api/package.json

EXPOSE 8000

ENV NODE_ENV=production
ENV LOG_LEVEL=info

CMD ["bun", "apps/api/dist/index.js"]
