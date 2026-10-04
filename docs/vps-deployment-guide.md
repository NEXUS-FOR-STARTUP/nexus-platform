# Safe VPS Deployment Guide — Nexus Platform

Hướng dẫn triển khai an toàn và chi tiết từng bước lên môi trường **Linux VPS** (`/opt/nexus/nexus-platform`).

---

## 1. Tổng quan Kiến trúc trên VPS

Hệ thống production chạy theo mô hình **Single Compose** (`docker-compose.prod.yml`) gồm 6 dịch vụ phối hợp qua Docker network `nexus-network` và Traefik `proxy-net`:

| Dịch vụ | Container Name | Quyền hạn / User | Port (Host / Traefik) | Vai trò |
| :--- | :--- | :--- | :--- | :--- |
| **Postgres** | `nexus-db` | `postgres` | `5432:5432` | Cơ sở dữ liệu chính (PostgreSQL 18.4) |
| **Redis** | `nexus-redis` | `redis` | `127.0.0.1:6390:6379` | Queue BullMQ (`omp-queue`) + Cache |
| **API** | `nexus-api` | `nexus` (UID 1001) | Traefik `:8000` | Backend Hono, Prisma, điều phối OMP |
| **Web** | `nexus-web` | `nextjs` (UID 1001) | Traefik `:3000` | Frontend Next.js 16 + Mantine UI |
| **Centrifugo**| `nexus-centrifugo`| `root` | `127.0.0.1:8010:8000` | Realtime WebSocket chat & sự kiện |
| **Worker OMP**| `nexus-worker-omp`| `root` | Nội bộ container | Worker thẩm định AI độc lập chạy sandbox |

---

## 2. Checklist Các Bước Deploy Từng Bước

### Bước 1: Kéo code mới về VPS
Đăng nhập vào VPS qua SSH và di chuyển vào thư mục dự án:
```bash
cd /opt/nexus/nexus-platform
git pull origin <ten-nhanh-deploy>
```

> **Lưu ý về thư mục `data/`:**
> Trên VPS thư mục `data/postgres/` đã được cấu hình trong `.gitignore`, do đó lệnh `git pull` sẽ giữ nguyên dữ liệu postgres host và tự động nạp thêm `data/knowledge/` cùng `data/system-prompts/`.

---

### Bước 2: Chạy khởi tạo quyền thư mục (`make setup`)
```bash
make setup
```
Lệnh này thực hiện tự động trong 1 giây các tác vụ bắt buộc sau:
1. Tạo Docker network `proxy-net` (nếu chưa có).
2. Tạo các thư mục lưu trữ: `storage/jobs`, `storage/auth/omp/agent`.
3. Phân quyền `chmod -R a+rwX storage` (đảm bảo container `nexus-api` chạy user UID 1001 và container `nexus-worker-omp` chạy user `root` đều có quyền đọc/ghi không bị lỗi `EACCES: permission denied`, bao gồm cả quyền cập nhật SQLite token `agent.db`).

---

### Bước 3: Cấu hình ChatGPT Plus OAuth cho Worker OMP (`agent.db`)
Để Worker sử dụng gói ChatGPT Plus qua mô hình `openai-codex/gpt-5.6-sol`:

1. **Đăng nhập trên máy cá nhân:**
   Trên máy tính cá nhân (đã cài OMP CLI), mở terminal chạy `omp` rồi gõ:
   ```text
   /login openai-codex
   ```
   Đăng nhập tài khoản ChatGPT Plus trên trình duyệt. OMP sẽ lưu token OAuth vào `~/.omp/agent/agent.db`.

2. **Copy file `agent.db` lên VPS:**
   ```bash
   scp ~/.omp/agent/agent.db user@vps_ip:/opt/nexus/nexus-platform/storage/auth/omp/agent/agent.db
   ```

3. **Phân quyền ghi:**
   ```bash
   chmod -R a+rwX /opt/nexus/nexus-platform/storage/auth/omp
   ```
   *(Container `nexus-worker-omp` mount `./storage/auth/omp:/root/.omp` ở chế độ Read-Write nên OMP sẽ tự động refresh token trong `agent.db` mỗi khi hết hạn mà không cần bất kỳ container phụ nào).*
---

### Bước 4: Kiểm tra và hoàn thiện file cấu hình `.env.prod`
Mở file `.env.prod`:
```bash
nano .env.prod
```
Đảm bảo đã có đầy đủ các biến môi trường quan trọng:
```ini
# Cấu hình Redis nội bộ
REDIS_HOST_PORT=6390

# Cấu hình Centrifugo Realtime
CENTRIFUGO_URL=http://centrifugo:8000
CENTRIFUGO_TOKEN_SECRET="<chuoi-hex-32-byte>"
CENTRIFUGO_API_KEY="<chuoi-hex-32-byte>"
NEXT_PUBLIC_CENTRIFUGO_URL=wss://${DOMAIN}/connection/websocket

# Cấu hình OMP Model (ChatGPT Plus OAuth hoặc MiMo fallback)
OMP_MODEL=openai-codex/gpt-5.6-sol
```

---

### Bước 5: Build và Khởi động Container

#### Trường hợp A: Build trực tiếp Worker trên VPS (Khuyến nghị)
Worker OMP build bằng `apps/worker-omp/Dockerfile` rất nhẹ (dưới 2 phút) vì dùng base Bun:
```bash
# 1. Pull các image prebuilt (API, Web) từ Docker Hub
docker compose --env-file .env.prod -f docker-compose.prod.yml pull api web

# 2. Build image worker-omp
docker compose --env-file .env.prod -f docker-compose.prod.yml build worker-omp

# 3. Khởi động toàn bộ dịch vụ ở chế độ nền
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

#### Trường hợp B: Dùng Makefile rút gọn
```bash
make deploy-api      # Kéo API mới và restart
make deploy-web      # Kéo Web mới và restart
make deploy-worker   # Kéo Worker mới và restart
# hoặc khởi động tất cả:
make start
```

---

### Bước 6: Kiểm tra sức khỏe hệ thống (Health Check)

Kiểm tra danh sách các container đang chạy:
```bash
docker compose -f docker-compose.prod.yml ps
```
**Kết quả mong muốn:** Cả 6 container đều ở trạng thái `Up` (hoặc `healthy`):
- `nexus-db` (healthy)
- `nexus-redis` (healthy)
- `nexus-api` (healthy)
- `nexus-web` (Up)
- `nexus-centrifugo` (healthy)
- `nexus-worker-omp` (Up)

Kiểm tra log theo thời gian thực của Worker:
```bash
docker compose -f docker-compose.prod.yml logs -f worker-omp
```
Log chuẩn khi khởi động:
```
[Worker-OMP] Starting OMP Worker daemon...
[Worker-OMP] Redis: redis:6379, Storage: /app/storage
```

Kiểm tra log của API:
```bash
docker compose -f docker-compose.prod.yml logs -f api
```

---

## 3. Các Lưu ý An toàn & Khắc phục Sự cố

### A. Tuyệt đối tuân thủ An toàn Database (DB Safety)
* **Không bao giờ chạy:** `prisma migrate reset`, `prisma db push`, hoặc chạy script SQL xóa bảng trên VPS.
* Dữ liệu Postgres được mount an toàn tại volume `postgres_data`.
* Bản backup luôn nằm tại `/opt/nexus/nexus-platform/backup/`. Trước khi có đợt update lớn, nên tạo bản snapshot:
  ```bash
  docker exec -t nexus-db pg_dump -U nexus -d nexus_platform > backup/backup-$(date +%Y%m%d-%H%M).sql
  ```

### B. Lỗi `EACCES: permission denied` khi ghi file kết quả thẩm định
* **Nguyên nhân:** Thư mục `storage/` trên host VPS thuộc quyền sở hữu của user khác ngoài UID 1001.
* **Cách sửa:**
  ```bash
  chmod -R a+rwX /opt/nexus/nexus-platform/storage
  ```

### C. Rollback về MiMo AI nếu cần
* **Cách rollback nhanh:**
  1. Sửa file `.env.prod`:
     ```ini
     OMP_MODEL=mimo/mimo-v2.5
     ```
  2. Restart Worker:
     ```bash
     docker compose --env-file .env.prod -f docker-compose.prod.yml restart worker-omp
     ```
### D. Kiểm tra dung lượng file `storage/jobs_db.json`
* Nếu file `storage/jobs_db.json` phình to quá mức, dùng script dọn dẹp đã được tối ưu để lưu trữ log vào disk thay vì nhồi toàn bộ string vào DB:
  ```bash
  bun run temp/repair-jobs-db.mjs
  ```
