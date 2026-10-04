# =============================================================================
# Dockerfile — Nexus Web-1 (Next.js 16 standalone)
# Multi-stage: turbo prune → deps → build → runner
# Build: docker build -f apps/web-1/Dockerfile -t nexus-web:latest .
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
RUN turbo prune nexus-platform-web-1 --docker

# -----------------------------------------------------------------------------
# Stage 3: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
COPY --from=turbo /app/out/json/ .
COPY --from=turbo /app/out/package-lock.json ./package-lock.json
RUN npm ci && mkdir -p /app/apps/web-1/node_modules

# -----------------------------------------------------------------------------
# Stage 4: Build
# -----------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=turbo /app/out/full/ .
COPY --from=turbo /app/out/package-lock.json ./package-lock.json

# Copy workspace-level node_modules (npm hoists only non-conflicting deps to root)
COPY --from=deps /app/apps/web-1/node_modules ./apps/web-1/node_modules

# Build-time envs
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CENTRIFUGO_URL
ENV NEXT_PUBLIC_CENTRIFUGO_URL=$NEXT_PUBLIC_CENTRIFUGO_URL
ENV NODE_ENV=production

RUN npm run build --workspace=nexus-platform-web-1

# -----------------------------------------------------------------------------
# Stage 5: Runner
# -----------------------------------------------------------------------------
FROM base AS runner
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
