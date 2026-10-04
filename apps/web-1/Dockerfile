# =============================================================================
# Dockerfile — Nexus Web-1 (Next.js 16 standalone)
# Multi-stage: turbo prune → deps (bun) → build (bun) → runner (node)
# Build: docker build -f apps/web-1/Dockerfile -t nexus-web:latest .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Bun Base (for deps & build)
# -----------------------------------------------------------------------------
FROM oven/bun:1.4.0-alpine AS bun-base
WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Turbo prune
# -----------------------------------------------------------------------------
FROM bun-base AS turbo
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune nexus-platform-web-1 --docker

# -----------------------------------------------------------------------------
# Stage 3: Dependencies
# -----------------------------------------------------------------------------
FROM bun-base AS deps
COPY --from=turbo /app/out/json/ .
RUN bun install --frozen-lockfile && mkdir -p /app/apps/web-1/node_modules

# -----------------------------------------------------------------------------
# Stage 4: Build
# -----------------------------------------------------------------------------
FROM bun-base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=turbo /app/out/full/ .
COPY --from=turbo /app/out/bun.lock ./bun.lock

# Copy workspace-level node_modules (ensured by mkdir -p in deps)
COPY --from=deps /app/apps/web-1/node_modules ./apps/web-1/node_modules

# Build-time envs
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CENTRIFUGO_URL
ENV NEXT_PUBLIC_CENTRIFUGO_URL=$NEXT_PUBLIC_CENTRIFUGO_URL
ENV NODE_ENV=production

RUN bun run --filter nexus-platform-web-1 build

# -----------------------------------------------------------------------------
# Stage 5: Runner (Node.js runtime for Next.js standalone stability)
# -----------------------------------------------------------------------------
FROM node:24.18.0-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Next.js standalone output (minimal server + node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-1/.next/standalone ./
# Static assets (client JS, CSS, chunks)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-1/.next/static ./apps/web-1/.next/static
# Public assets (images, fonts, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-1/public ./apps/web-1/public

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "apps/web-1/server.js"]
