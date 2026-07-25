# Build and Push Docker Images — Nexus Platform

Guide build và push Docker images cho Nexus Platform lên Docker Hub.

`NEXT_PUBLIC_API_URL=https://nexusforstartup.site`

## Prerequisites

- Docker installed and running
- Docker Hub account: `lgdlong`

## Image Naming Convention

| Service | Image Name | Dockerfile |
|---------|------------|------------|
| API | `lgdlong/nexus-api:latest` | `apps/api/Dockerfile` |
| Web | `lgdlong/nexus-web:latest` | `apps/web-1/Dockerfile` |

## Architecture

Dùng Turborepo `turbo prune --docker` trong Dockerfile — chỉ prune workspace cần thiết + lockfile:

```
turbo prune → npm ci (pruned deps) → build → runner (minimal)
```

Build context là **repo root**, Dockerfile nằm trong `apps/*`.

### ⚠️ npm Workspace Hoisting

Trong builder stage, Dockerfile copy thêm workspace-level `node_modules/` vì npm **không hoist** được tất cả package lên root:

```dockerfile
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
```

Lý do: npm workspaces chỉ hoist package lên root `node_modules/` khi không có version conflict. Các package sau bị giữ ở workspace-level:

- `@ai-sdk/google` — conflict `@ai-sdk/provider` version với `@ai-sdk/openai`
- `next` — conflict version giữa lockfile và package.json (`16.2.0` vs `16.2.9`)
- Các transitive dependency khác có version conflict

Nếu thiếu dòng COPY này, build sẽ fail với lỗi:
- **API**: `TS2307: Cannot find module '@ai-sdk/google'`
- **Web**: `sh: next: not found`

## Build and Push Commands

### 1. Login Docker Hub

```bash
docker login
```

### 2. Build API Image

```bash
docker build -f apps/api/Dockerfile -t lgdlong/nexus-api:latest .
```

### 3. Build Web Image

```bash
# NEXT_PUBLIC_API_URL baked at build time (Next.js inlines vào JS bundle)
docker build -f apps/web-1/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://nexusforstartup.site \
  -t lgdlong/nexus-web:latest .
```

`NEXT_PUBLIC_API_URL` là build-time only — không cần trong `.env.prod` hay compose environment.

### 4. Push cả 2 lên Docker Hub

```bash
docker push lgdlong/nexus-api:latest
docker push lgdlong/nexus-web:latest
```

## Quick — Makefile

```bash
make build domain=nexusforstartup.site
make push

# Hoặc 1 lệnh
make build-push domain=nexusforstartup.site
```

## Manual One-Liner

```bash
# Build & push API
docker build -f apps/api/Dockerfile -t lgdlong/nexus-api:latest . && docker push lgdlong/nexus-api:latest

# Build & push Web
docker build -f apps/web-1/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://nexusforstartup.site \
  -t lgdlong/nexus-web:latest . && docker push lgdlong/nexus-web:latest
```

## On VPS — Deploy

```bash
make deploy
# Hoặc manual
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

`pull_policy: always` trong `docker-compose.prod.yml` đảm bảo luôn pull image mới nhất.

## Troubleshooting

### "file not found" khi build

- Chạy từ **repo root** (không từ `apps/api/` hay `apps/web-1/`)
- `.dockerignore` không block file cần thiết
- `prisma/` directory tồn tại ở root

### "module not found" / "binary not found" khi build (Docker)

Lỗi điển hình:
```
src/services/google-provider.ts: TS2307: Cannot find module '@ai-sdk/google'
# hoặc
sh: next: not found
```

**Nguyên nhân:** npm workspaces không hoist được package lên root `node_modules/` do version conflict. Dockerfile builder stage chỉ copy root `node_modules/`, thiếu workspace-level `node_modules/`.

**Fix:** Thêm dòng COPY workspace node_modules trong builder stage:
```dockerfile
COPY --from=deps /app/apps/<workspace>/node_modules ./apps/<workspace>/node_modules
```

Đã áp dụng cho cả `apps/api/Dockerfile` và `apps/web-1/Dockerfile`.

### Prisma schema not found

API Dockerfile COPY `prisma/` thủ công vì `turbo prune` không include file ngoài workspace deps.

### Web image sai NEXT_PUBLIC_API_URL

- Sửa giá trị trong lệnh build `--build-arg NEXT_PUBLIC_API_URL=...` → rebuild
- Đổi domain → rebuild web image (không chỉ restart container)
- Check bằng `curl http://localhost:3000`

### BuildKit

Docker Desktop mặc định bật BuildKit. Nếu dùng Docker engine cũ:

```bash
# Linux/macOS
export DOCKER_BUILDKIT=1

# Windows PowerShell
$env:DOCKER_BUILDKIT=1
```

## CI/CD Integration

```yaml
- name: Build and push API
  run: |
    docker build -f apps/api/Dockerfile -t lgdlong/nexus-api:latest .
    docker push lgdlong/nexus-api:latest

- name: Build and push Web
  run: |
    docker build -f apps/web-1/Dockerfile \
      --build-arg NEXT_PUBLIC_API_URL=https://nexusforstartup.site \
      -t lgdlong/nexus-web:latest .
    docker push lgdlong/nexus-web:latest
```
