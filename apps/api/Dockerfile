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
# Stage 4: Production Dependencies (only runtime deps, no dev/peer-dev)
# -----------------------------------------------------------------------------
FROM base AS prod-deps
COPY --from=turbo /app/out/json/ .
RUN bun install --production --omit=peer --frozen-lockfile && mkdir -p /app/apps/api/node_modules

# -----------------------------------------------------------------------------
# Stage 5: Build
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

# Build the API (generates prisma client and compiles via tsconfig.build.json without tests)
RUN bun run --filter nexus-platform-api build

# -----------------------------------------------------------------------------
# Stage 6: Runner
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
# Root node_modules — copy from prod-deps stage (no devDependencies, minimal size)
COPY --from=prod-deps --chown=nexus:nodejs /app/node_modules ./node_modules
# Workspace-level node_modules
COPY --from=prod-deps --chown=nexus:nodejs /app/apps/api/node_modules ./apps/api/node_modules
# Shared packages needed at runtime (exports raw TS, referenced via symlink)
COPY --from=builder --chown=nexus:nodejs /app/packages ./packages

# ── Prisma generated client (generated during build; overlay from builder) ──
COPY --from=builder --chown=nexus:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nexus:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# ── Prisma CLI & Schema (enables 'docker compose exec api bun x prisma migrate deploy') ──
COPY --from=deps --chown=nexus:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps --chown=nexus:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder --chown=nexus:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nexus:nodejs /app/prisma.config.ts ./prisma.config.ts

# ── Changing layers (rebuilt every source change) ──
# Compiled output — includes pdf templates & fonts (copied by build script, no test files)
COPY --from=builder --chown=nexus:nodejs /app/apps/api/dist ./apps/api/dist
# Package.json for workspace context
COPY --from=builder --chown=nexus:nodejs /app/apps/api/package.json ./apps/api/package.json
EXPOSE 8000

ENV NODE_ENV=production
ENV LOG_LEVEL=info

CMD ["bun", "apps/api/dist/index.js"]
