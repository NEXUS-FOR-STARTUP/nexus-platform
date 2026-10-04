# Worker OMP Docker Cleanup & Single Compose Architecture

**Date**: 2026-09-13 06:00  
**Status**: Resolved  
**Scope**: DevOps, Docker Compose, Worker OMP, Storage Atomic Write  
**Plan**: `plans/260913-0600-worker-omp-docker-cleanup/plan.md`  

---

## 1. What Happened

Worker OMP chạy trên container Linux nhưng code cấu hình còn sót lại nhiều logic xử lý Windows (`win32`, `USERPROFILE`, `OMP_BIN`). Hệ thống tồn tại 2 file compose riêng biệt (`docker-compose.prod.yml` và `docker-compose.worker.yml`) gây xung đột tên project Docker trên VPS. Đồng thời, file `storage/jobs_db.json` bị phình to (29MB) do chứa null bytes khi ghi file đồng thời không an toàn.

## 2. Technical Decisions

1. **Kiến trúc 1 File Compose Duy nhất (`docker-compose.prod.yml`)**:
   - Gộp service `worker-omp` và `redis` vào chung `docker-compose.prod.yml`. Xoá bỏ hoàn toàn `docker-compose.worker.yml`.
   - Redis bind an toàn vào `127.0.0.1:${REDIS_HOST_PORT:-6390}:6379` để API trên Windows host kết nối thuận tiện khi dev, không bị lộ ra public internet trên VPS.
2. **Loại bỏ Hoàn toàn Code Windows trong Worker**:
   - Do Worker OMP chạy 100% trong Docker container Linux, toàn bộ code nhánh `win32` trong `config.ts` được dọn sạch.
   - Loại `worker-omp` khỏi Turbo dev pipeline (`bun run dev` chỉ khởi động API và Web trên host).
3. **Cơ chế Ghi Atomic Bảo vệ Storage (`jobs_db.json`)**:
   - Cắt tỉa null bytes, repair và prune `storage/jobs_db.json` từ 29MB về dưới 100KB.
   - Áp dụng cơ chế Atomic Write (ghi ra file tạm `.tmp` rồi đổi tên `renameSync`) trong cả API repository và Worker storage để ngăn chặn triệt để tình trạng corrupt file khi có sự cố ngắt nguồn.
4. **Cloudinary Retry Policy**:
   - Thêm cơ chế tự động thử lại (retry 1 lần) khi upload PDF lên Cloudinary gặp sự cố mạng chập chờn.

## 3. Key Changes

- `apps/worker-omp/src/config.ts`: Xoá bỏ hoàn toàn logic dò tìm binary Windows.
- `docker-compose.prod.yml`: Tích hợp các service `db`, `redis`, `worker-omp` trong 1 file cấu hình duy nhất.
- `package.json`: Cập nhật các script `docker:dev`, `docker:up`, `docker:down`.
- `apps/api/src/modules/ai-engine/infrastructure/job-store.repository.ts` & `apps/worker-omp/src/storage.ts`: Thêm helper ghi file atomic.

## 4. Verification

- Chạy `docker compose -f docker-compose.prod.yml up` khởi động trơn tru cả 3 containers.
- Thử nghiệm mô phỏng kill process trong lúc ghi job: file `jobs_db.json` không bị dính null byte hay corrupt.
- Upload PDF lên Cloudinary thành công với cơ chế retry an toàn.
