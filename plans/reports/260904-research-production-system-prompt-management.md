# Research Report: Kiến Trúc Lưu Trữ & Quản Lý System Prompt Cho Hệ Thống AI Production

- **Ngày thực hiện:** 2026-09-04
- **Công cụ nghiên cứu:** `agy` (Antigravity CLI / Gemini 3.8 Flash High) kết hợp phân tích kiến trúc web/LLM hiện đại
- **Đối tượng áp dụng:** Nexus Platform (Node.js, Hono, Next.js 16, Prisma ORM, PostgreSQL)

---

## 1. Tóm Tắt Tổng Quan (Executive Summary)

Trong các hệ thống AI tự động (Automated AI Agents / LLM Pipelines), System Prompt không đơn thuần là một đoạn text cấu hình, mà là **một thành phần mã nguồn cốt lõi (Core Code Artifact)** quyết định trực tiếp đến tính ổn định của toàn bộ parser và logic downstream. 

Nếu chỉ lưu prompt trong code (Git-only), hệ thống mất khả năng hot-fix và thử nghiệm linh hoạt. Ngược lại, nếu lưu prompt thuần túy trong database mà thiết kế sai (ví dụ cho phép UPDATE đè nội dung), hệ thống sẽ đối mặt với 3 rủi ro nghiêm trọng:
1. **Gãy Parser (Breaking Contract)**: Prompt thay đổi dẫn đến output format của LLM bị lệch, làm sập parser JSON/Zod ở tầng code backend.
2. **Mất khả năng tái lập & truy vết (Loss of Reproducibility/Audit Trail)**: Khi user báo lỗi về một bản audit cũ, hệ thống không thể biết tại thời điểm đó AI đã chạy với phiên bản prompt nào.
3. **Cạn kiệt tài nguyên Database (Connection Exhaustion) & Độ trễ**: Đọc prompt từ PostgreSQL ở mỗi bước chạy của agent làm tăng latency thêm 10–50ms và có thể làm nghẽn connection pool khi traffic tăng cao.

**Giải pháp chuẩn Production**: Mô hình **Hybrid GitOps / Database Deployment kết hợp Multi-tier In-Memory SWR Cache và Local Static Fallback**.

---

## 2. So Sánh Các Mô Hình Kiến Trúc Trên Thực Tế

| Tiêu chí | 1. Git-based (Code/Markdown) | 2. Database-driven (SQL Table) | 3. Hybrid / GitOps Sync | 4. Dedicated Registry (Langfuse/Braintrust) |
| :--- | :--- | :--- | :--- | :--- |
| **Độ trễ (Latency)** | **0 ms** (Đọc từ RAM bộ nhớ tiến trình) | **10 - 50 ms** (nếu query trực tiếp DB) | **< 1 ms** (In-memory cache L1) | **< 1 ms** (nếu SDK có in-memory cache) |
| **Tính tái lập (Reproducibility)** | **Rất cao** (gắn chặt Git commit) | **Rất kém** nếu UPDATE đè; **Rất cao** nếu có bảng Version bất biến | **Rất cao** (Version DB ánh xạ với Git hash) | **Rất cao** (quản lý commit/release tag trên SaaS) |
| **Kiểm soát & Audit Trail** | **Tốt** qua Git log & Pull Request | Tùy biến theo schema tự thiết kế | **Hoàn hảo** (Git PR + DB deployment audit) | **Rất tốt** (giao diện playground, metrics) |
| **Tốc độ Hot-fix** | **Chậm** (phải build và redeploy app) | **Tức thì** (đổi con trỏ deployment trong DB) | **Nhanh** (qua script sync hoặc CI/CD trigger) | **Tức thì** (đổi tag trên UI) |
| **Rủi ro sập khi DB downtime** | **Bằng 0** (không phụ thuộc DB) | **Rất cao** nếu không có fallback | **Bằng 0** (có phao cứu sinh static fallback) | **Thấp** (nếu SDK có local fallback) |

---

## 3. Thiết Kế Schema Bảng Chuẩn Cho PostgreSQL (Prisma ORM)

Để đảm bảo hiệu năng và tính toàn vẹn dữ liệu, thiết kế chuẩn cho Nexus Platform áp dụng mô hình **Bảng cha (Prompt Identity)** và **Bảng con (Immutable Prompt Version)**:

```prisma
// 1. Bảng định danh Logical Prompt
model SystemPrompt {
  id          String   @id @default(uuid())
  prompt_key  String   @unique // Ví dụ: "triad_framework", "input_gate_lite", "input_gate_full"
  name        String   // Tên gợi nhớ
  description String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  versions    SystemPromptVersion[]
  deployments SystemPromptDeployment[]

  @@map("system_prompts")
}

// 2. Bảng lưu từng phiên bản - TUYỆT ĐỐI BẤT BIẾN (IMMUTABLE)
model SystemPromptVersion {
  id             String   @id @default(uuid())
  prompt_id      String
  version        Int      // 1, 2, 3... tăng tự động
  content        String   @db.Text // Nội dung raw của system prompt
  model_config   Json     @default("{}") // { "model": "gemini-2.0-flash", "temperature": 0.1 }
  input_schema   Json?    // Zod / JSON schema đầu vào nếu có
  content_hash   String   // SHA256 để chống trùng lặp nội dung
  change_log     String?  // Ghi chú thay đổi: "Cập nhật rule CP1"
  created_by     String?  // User ID của người tạo
  created_at     DateTime @default(now())

  prompt         SystemPrompt @relation(fields: [prompt_id], references: [id], onDelete: Cascade)
  deployments    SystemPromptDeployment[]
  ai_jobs        AiJob[]

  @@unique([prompt_id, version])
  @@index([prompt_id])
  @@map("system_prompt_versions")
}

// 3. Bảng điều hướng phiên bản đang hoạt động (Active Pointer)
model SystemPromptDeployment {
  id                String   @id @default(uuid())
  prompt_id         String
  environment       String   @default("production") // "production", "staging"
  prompt_version_id String
  updated_at        DateTime @updatedAt

  prompt            SystemPrompt        @relation(fields: [prompt_id], references: [id], onDelete: Cascade)
  version           SystemPromptVersion @relation(fields: [prompt_version_id], references: [id], onDelete: Restrict)

  @@unique([prompt_id, environment])
  @@map("system_prompt_deployments")
}
```

### Nguyên tắc Bất biến (Immutability):
- **Không bao giờ chạy lệnh `UPDATE` nội dung trên `system_prompt_versions`**.
- Khi muốn sửa prompt, luôn luôn `INSERT` một bản ghi version mới.
- Khi kích hoạt version mới, chỉ cập nhật khóa ngoại `prompt_version_id` trên bảng `system_prompt_deployments`.
- **Khả năng Rollback tức thì**: Nếu version mới gây lỗi format, chỉ cần 1 thao tác update lại `prompt_version_id` về phiên bản cũ là hệ thống lập tức trở về trạng thái ổn định trong 0 giây.

---

## 4. Cơ Chế Bộ Nhớ Đệm (Caching) & Phao Cứu Sinh (Fallback Mechanism)

Để đảm bảo pipeline AI đạt chuẩn High Availability (HA):
1. **L1 In-Memory Cache (LRU Cache với cơ chế SWR)**:
   - Worker backend giữ bản cache prompt trên RAM.
   - Khi cần prompt, hệ thống đọc trực tiếp từ RAM (`latency < 1ms`).
   - Thời gian tồn tại TTL từ 5–10 phút, tự động query DB kiểm tra phiên bản mới dưới background.
2. **Cơ chế Invalidation Tức Thì**:
   - Khi Admin kích hoạt version mới trên Dashboard, hệ thống phát tín hiệu invalidate (qua PostgreSQL `LISTEN/NOTIFY` hoặc Centrifugo/Redis) để các worker xóa cache key tương ứng.
3. **Phao cứu sinh khi DB sập (Bundled Static Fallback)**:
   - Trong quá trình build (Docker/CI), một bản snapshot các prompt active được xuất tự động ra file `fallback-prompts.generated.json`.
   - Nếu kết nối database bị gián đoạn (timeout, pool nghẽn, restart), hệ thống tự động rơi về dùng file fallback này. Pipeline AI của sinh viên vẫn chạy bình thường, không sinh lỗi 500.

---

## 5. Đề Xuất Áp Dụng Cho Nexus Platform

1. **Bước 1 (Schema)**: Cập nhật `prisma/schema.prisma` với 2 bảng tinh gọn: `SystemPrompt` (quản lý prompt key) và `SystemPromptVersion` (chứa content bất biến và cờ `is_active`).
2. **Bước 2 (Seed)**: Nạp 5 file prompt hiện tại trong `data/system-prompts/` vào database làm Version 1.0 (trạng thái `is_active = true`).
3. **Bước 3 (Service Layer)**: Xây dựng `SystemPromptService` trong `apps/api` có gắn In-Memory LRU Cache và Local Static Fallback.
4. **Bước 4 (Observability)**: Liên kết `prompt_version_id` vào bảng `ai_jobs` và `reports` để phục vụ việc truy vết chất lượng đánh giá sau này.
