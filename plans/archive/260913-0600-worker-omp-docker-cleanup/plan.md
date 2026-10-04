---
description: "OMP Worker Docker Cleanup (1 Compose duy nhất): Xóa code Windows thừa trong config.ts, gộp Redis + Worker vào docker-compose.prod.yml, loại worker khỏi turbo dev pipeline, repair & prune jobs_db.json, và bảo vệ atomic write."
status: completed
priority: P1
effort: 2h
branch: feat/79k-dual-credit
tags: [infra, cleanup, docker, worker-omp, single-compose]
blockedBy: []
blocks: []
created: 2026-09-13
---

# OMP Worker Docker Cleanup (Single Compose Architecture)

## Overview

OMP worker chạy exclusively trong Docker container (Linux) để đảm bảo môi trường thực thi OMP CLI ổn định, không bị lỗi cmd.exe trên Windows.

Plan này đồng bộ toàn bộ kiến trúc về **1 file Docker Compose duy nhất** (`docker-compose.prod.yml`), giải quyết dứt điểm tình trạng 2 compose files gây collision, cấu hình Redis chung cho cả API và Worker, dọn sạch code Windows thừa, và sửa lỗi corrupt file `storage/jobs_db.json`.

## Design Decisions

| Decision | Choice | Why |
|---|---|---|
| **Compose Strategy** | **1 Compose File duy nhất** (`docker-compose.prod.yml`) | Loại bỏ hoàn toàn collision tên project. Tất cả service nằm chung 1 file |
| **Local Dev Workflow** | `docker:dev` + `bun run dev` | Docker chạy `db`, `redis`, `worker-omp`. Host Windows chạy API + Web |
| **Redis Binding** | `127.0.0.1:${REDIS_HOST_PORT:-6390}:6379` | API trên host Windows kết nối được qua localhost; không bị lộ ra public internet trên VPS |
| **Worker Runtime** | Docker only | Worker dùng OMP CLI trên Linux, không chạy trực tiếp trên Windows host |
| **Windows Code** | Delete entirely | Docker container là Linux, toàn bộ code `win32` và `USERPROFILE` là dead weight |
| **Turbo Pipeline** | Exclude worker-omp | `bun run dev` chỉ start API (:8000) + Web (:3001) trên host |
| **Data Sharing** | Shared volume `./storage` + Atomic Write | Giữ nguyên kiến trúc file-based đơn giản (KISS/DRY như sandbox). Dùng tmp + rename để chống corrupt |
| **Cloudinary** | Fail-loud + retry | Upload PDF retry 1 lần nếu gặp lỗi mạng |

## Scope

### In Scope
1. Xóa toàn bộ code Windows thừa trong `apps/worker-omp/src/config.ts` (`win32` gate, `findWindowsExe`, `OMP_BIN`, `USERPROFILE`).
2. Gộp `redis` + `worker-omp` vào `docker-compose.prod.yml`, cấu hình port Redis an toàn cho host dev.
3. Xóa bỏ `docker-compose.worker.yml`.
4. Cập nhật npm scripts trong `package.json` (`docker:dev`, `docker:up`, `docker:down`, `dev`).
5. Repair và prune `storage/jobs_db.json` (cắt null bytes, giảm dung lượng từ 29MB về < 100KB).
6. Áp dụng cơ chế Atomic Write (tmp + rename) vào `job-store.repository.ts` và worker `storage.ts`.
7. Thêm cơ chế retry cho Cloudinary trong `omp-audit-finalizer.ts`.

### Out of Scope
- **KHÔNG thay đổi Prisma schema**, **KHÔNG chạy migration** (DB đã có sẵn `id: "ai-job-${caseId}"` đủ cho upsert).
- **KHÔNG tạo HTTP endpoint `/api/internal/*`** (giữ nguyên file volume + Redis queue đơn giản, tránh đứt mạch SSE và tránh lộ qua Traefik).
- **KHÔNG thêm container backup cron** (đã có quy trình backup riêng trong `docs/db-backup-guide.md`).

## Phases

| Phase | Name | Effort | Status |
|---|---|---|---|
| 01 | [Config.ts: Xóa triệt để code Windows](./phase-01-config-cleanup.md) | 0.5h | Completed |
| 02 | [Single Compose: Merge Redis + Worker vào Prod Compose](./phase-02-compose-and-pipeline.md) | 0.5h | Completed |
| 03 | [Repair & Prune jobs_db.json (29MB → <100KB)](./phase-03-repair-jobs-db.md) | 0.5h | Completed |
| 04 | [Atomic Write & Cloudinary Resilience](./phase-04-data-safety.md) | 0.5h | Completed |

## Key Files

| File | Change |
|---|---|
| `apps/worker-omp/src/config.ts` | Xóa `delimiter`, `OMP_BIN`, `win32` branch, `findWindowsExe()`, và toàn bộ `USERPROFILE` |
| `docker-compose.prod.yml` | Thêm `redis` (port 127.0.0.1:6379) + `worker-omp`; fix `api` mount `./storage` + `REDIS_HOST=redis` |
| `docker-compose.worker.yml` | **Xóa file** |
| `package.json` | `dev`: thêm `--filter='!@app/worker-omp'`; thêm `docker:dev`; cập nhật `docker:up/down` |
| `apps/api/.../job-store.repository.ts` | Atomic write (tmp + renameSync) + dọn dẹp path sandbox thừa |
| `apps/worker-omp/src/storage.ts` | Atomic write (tmp + renameSync) khi ghi `jobs_db.json` |
| `apps/api/.../omp-audit-finalizer.ts` | Cloudinary fail-loud + retry |
| `temp/repair-jobs-db.mjs` | Strip null bytes, close JSON array, prune chỉ giữ 5-10 jobs gần nhất |
| `storage/jobs_db.json` | File sau sửa sạch, dung lượng nhẹ |

## Verification

1. `bun run check-types` — pass (type-safe).
2. `docker compose -f docker-compose.prod.yml config` — valid YAML, project `nexus-platform`, 6 services.
3. `bun run docker:dev` — khởi động thành công `db`, `redis`, `worker-omp`.
4. `bun run dev` — API kết nối thành công Redis `127.0.0.1:6379`, Web chạy `3001`.
5. Trigger 1 job thẩm định test — API dispatch → Redis → Worker container xử lý → ghi log vào `./storage/jobs_db.json` → SSE trên UI cập nhật realtime mượt mà.
6. `node -e "JSON.parse(require('fs').readFileSync('storage/jobs_db.json','utf8'))"` — parse hợp lệ, dung lượng < 100KB.
