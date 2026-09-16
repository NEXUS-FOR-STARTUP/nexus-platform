FROM oven/bun:1-debian AS runner

# Lightweight utilities needed for git and sqlite (minimal apt, ZERO nodejs, ZERO npm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Oh My Pi globally with Bun (pure Bun package manager)
RUN bun add -g @oh-my-pi/pi-coding-agent

ENV PATH="/root/.bun/bin:${PATH}"
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
WORKDIR /app

# Copy monorepo files
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker-omp/package.json ./apps/worker-omp/

RUN bun install --frozen-lockfile || bun install

COPY packages/shared ./packages/shared
COPY apps/worker-omp ./apps/worker-omp
COPY data ./data

ENV NODE_ENV=production
ENV STORAGE_DIR=/app/storage
ENV KNOWLEDGE_DIR=/app/data/knowledge
ENV SAMPLES_DIR=/app/data/samples

# Create worker directories for isolated execution and copy providers models.json
RUN mkdir -p /root/.omp/agent /app/storage && \
    if [ -f /app/data/providers.json ]; then \
      cp /app/data/providers.json /root/.omp/agent/models.json; \
    elif [ -f /app/data/providers.example.json ]; then \
      cp /app/data/providers.example.json /root/.omp/agent/models.json; \
    fi

CMD ["bun", "run", "apps/worker-omp/src/index.ts"]
