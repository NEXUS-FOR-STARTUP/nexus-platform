# Phase 02: Single Compose — Merge Redis + Worker vào Prod Compose

## Target
- `docker-compose.prod.yml`
- `docker-compose.worker.yml` (xóa file)
- `package.json`

## Context
Việc duy trì 2 file compose (`docker-compose.prod.yml` và `docker-compose.worker.yml`) cùng đặt `name: nexus-platform` là nguyên nhân gây ra conflict và nguy cơ xoá nhầm container khi chạy `down`.

Chúng ta gom toàn bộ về **1 file `docker-compose.prod.yml` duy nhất**, phục vụ cho cả 2 môi trường:
- **Local Dev**: Khởi động các hạ tầng phụ trợ (`db`, `redis`, `worker-omp`) bằng Docker, còn `api` và `web` chạy trực tiếp trên máy host qua `bun run dev`.
- **Production (VPS)**: Khởi động toàn bộ cả 6 service trong Docker.

---

## Changes

### 1. Thêm `redis` vào `docker-compose.prod.yml`

```yaml
  redis:
    image: redis:7-alpine
    container_name: nexus-redis
    restart: unless-stopped
    stop_grace_period: 10s
    ports:
      # Expose về 127.0.0.1:6390 để host API (bun run dev) kết nối được (khớp với .env hiện tại)
      # và tránh đụng độ với evaluator-redis (6379) của repo sandbox
      - "127.0.0.1:${REDIS_HOST_PORT:-6390}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
    networks:
      - nexus-network
```

### 2. Thêm `worker-omp` vào `docker-compose.prod.yml`

Khai báo đồng thời cả `build` và `image` để hỗ trợ cả việc build local lẫn pull image trên VPS:

```yaml
  worker-omp:
    build:
      context: .
      dockerfile: Dockerfile.worker-omp
    image: lgdlong/nexus-worker-omp:latest
    container_name: nexus-worker-omp
    restart: unless-stopped
    stop_grace_period: 30s
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - STORAGE_DIR=/app/storage
      - NODE_ENV=production
      - OMP_MODEL=${OMP_MODEL:-}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
    volumes:
      - ./storage:/app/storage
      - ./data:/app/data:ro
      - ${HOST_OMP_AUTH_FILE:-./storage/auth/omp/auth.json}:/root/.omp/agent/auth.json:ro
    depends_on:
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
    networks:
      - nexus-network
```

### 3. Cập nhật `api` service trong `docker-compose.prod.yml`

Thêm mount volume `./storage` và kết nối Redis cho API container khi chạy prod:

```yaml
    environment:
      # ... các biến hiện có ...
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./storage:/app/storage
```

### 4. Cập nhật `package.json` scripts

```json
// Before
"dev": "turbo run dev",
"docker:worker-up": "docker compose -f docker-compose.worker.yml up -d --build",
"docker:worker-down": "docker compose -f docker-compose.worker.yml down",
"dev:worker-omp": "bun --filter @app/worker-omp dev",

// After
"dev": "turbo run dev --filter='!@app/worker-omp'",
"docker:dev": "docker compose -f docker-compose.prod.yml up -d db redis centrifugo worker-omp",
"docker:up": "docker compose -f docker-compose.prod.yml up -d",
"docker:down": "docker compose -f docker-compose.prod.yml down",
```

**Cách sử dụng khi phát triển local:**
1. Chạy `bun run docker:dev` để bật DB + Redis + Centrifugo + OMP Worker trong Docker.
2. Chạy `bun run dev` để bật API (`:8000`) và Web (`:3001`) trên host.
Host API kết nối vào `127.0.0.1:6379` (Redis) và chia sẻ thư mục `./storage` với Worker container.

### 5. Xóa `docker-compose.worker.yml`
Không còn cần thiết nữa vì mọi service đã được chuẩn hóa trong `docker-compose.prod.yml`.

---

## Acceptance
- [x] `docker-compose.prod.yml` chứa đủ 6 service (`db`, `redis`, `worker-omp`, `api`, `web`, `centrifugo`).
- [x] Port Redis `127.0.0.1:6390` bind đúng localhost.
- [x] `docker compose -f docker-compose.prod.yml config` hợp lệ, không báo lỗi cú pháp.
- [x] `docker-compose.worker.yml` đã được xóa sạch.
- [x] Lệnh `bun run docker:dev` chỉ bật các container backend cần thiết.
- [x] Lệnh `bun run dev` khởi động API và Web trơn tru, không chạy ngầm worker-omp trên host.
