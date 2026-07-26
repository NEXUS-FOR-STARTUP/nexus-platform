# Database Migration trên Production VPS — Nexus Platform

Hướng dẫn chạy Prisma migration an toàn trên production sử dụng Docker container.

> ⚠️ **ĐỌC TRƯỚC KHI CHẠY BẤT CỨ LỆNH NÀO**
>
> Migration trên production DB là thao tác **nguy hiểm**. Sai sót có thể gây mất dữ liệu không thể khôi phục.
>
> **Tham khảo:** [.agents/rules/prisma-migration-safety.md](../.agents/rules/prisma-migration-safety.md) — migration safety, DB mutation rules, target DB classification.

## Prerequisites

- SSH vào VPS
- Docker container API đang chạy (check: `docker ps | grep nexus-api`)
- File `.env.prod` tại thư mục chứa `docker-compose.prod.yml`
- Migration file đã được tạo ở local và **push lên Docker Hub** (qua build API image mới)

## Lệnh Migration

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  npx prisma migrate deploy --schema prisma/schema.prisma
```

### Giải thích

| Phần | Ý nghĩa |
|------|---------|
| `docker compose -f docker-compose.prod.yml` | Dùng compose file production |
| `--env-file .env.prod` | Load biến môi trường từ file `.env.prod` (chứa `DATABASE_URL`) |
| `exec api` | Chạy lệnh trong container API đang chạy (không tạo container mới) |
| `npx prisma migrate deploy` | Áp dụng migration chưa chạy vào database (chỉ chạy migration mới, không reset) |
| `--schema prisma/schema.prisma` | Đường dẫn schema file trong container |

## Workflow Chuẩn

### 1. Local — Tạo Migration File

```bash
# Chỉ --create-only, tuyệt đối không migrate dev trên production DB
npx prisma migrate dev --create-only
```

Kiểm tra file migration ở `prisma/migrations/<timestamp>_<name>/`.

### 2. Build & Push API Image

```bash
docker build --no-cache -f apps/api/Dockerfile -t lgdlong/nexus-api:latest .
docker push lgdlong/nexus-api:latest
```

> `--no-cache` bắt buộc — Prisma Client generate phụ thuộc vào schema. Cache layer không tự invalidate.

### 3. Pull Image trên VPS

```bash
docker compose -f docker-compose.prod.yml pull api
```

### 4. Restart Container

```bash
docker compose -f docker-compose.prod.yml up -d api
```

### 5. Chạy Migration

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  npx prisma migrate deploy --schema prisma/schema.prisma
```

Output kỳ vọng:
```
Prisma Migrate deployed the following migration(s):
  <timestamp>_<name>

✔ All migrations have been successfully applied.
```

## Verify

### Kiểm tra migration đã áp dụng

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  npx prisma migrate status --schema prisma/schema.prisma
```

Output kỳ vọng:
```
Prisma Migrate status:
- <timestamp>_<name>: Already applied
```

### Kiểm tra Prisma Client version khớp với schema

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  npx prisma version
```

## Quick — One-liner

```bash
# Pull, restart, migrate
docker compose -f docker-compose.prod.yml pull api && \
  docker compose -f docker-compose.prod.yml up -d api && \
  docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
    npx prisma migrate deploy --schema prisma/schema.prisma
```

## Troubleshooting

### "Error: P1001: Can't reach database server"

- Kiểm tra `DATABASE_URL` trong `.env.prod` — có thể sai host/port/credentials
- Kiểm tra network container có reach được database không:
  ```bash
  docker compose -f docker-compose.prod.yml exec api sh -c 'nc -zv $DATABASE_HOST 5432'
  ```

### Migration conflict (migration file đã applied nhưng Prisma không nhận ra)

Không chạy `prisma migrate resolve`. Liên hệ admin.

### "Error: P3016 — Migration failed"

Migration có lỗi SQL. Rollback bằng cách deploy image cũ và sửa migration file ở local.

## Safety Rules (KHÔNG VI PHẠM)

| Hành động | Được phép? | Ghi chú |
|-----------|-----------|---------|
| `prisma migrate deploy` | ✅ | Chỉ chạy migration chưa applied |
| `prisma migrate status` | ✅ | Chỉ đọc, an toàn |
| `prisma migrate dev` | ❌ | **Tuyệt đối không** — chạy full run, có thể reset DB |
| `prisma migrate reset` | ❌ | Sẽ xoá toàn bộ dữ liệu |
| `prisma db push` | ❌ | Không qua migration, không thể rollback |
| `prisma migrate resolve` | ⚠️ | Chỉ khi có người hiểu rõ hậu quả |

## Reference

- [Prisma Migrate Deploy Documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/deploying-changes)
- [Docker Compose Exec Reference](https://docs.docker.com/compose/reference/exec/)
- [docs/docker-build-push-guide.md](./docker-build-push-guide.md)
- [docs/db-backup-guide.md](./db-backup-guide.md)
- [.agents/rules/prisma-migration-safety.md](../.agents/rules/prisma-migration-safety.md)
