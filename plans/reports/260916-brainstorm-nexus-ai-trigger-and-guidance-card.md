# Báo Cáo Phân Tích & Brainstorm Giải Pháp: Fix Nghẽn Luồng Kích Hoạt Nexus AI & Giao Diện Case Submitted

**Mã tài liệu:** `plans/reports/260916-brainstorm-nexus-ai-trigger-and-guidance-card.md`  
**Ngày:** 16/09/2026  
**Chuyên gia:** Solution Brainstormer (ck:brainstorm & Production Standards)  
**Phạm vi:** `apps/api` (AI Engine Coordinator, Submit Intake UseCase) & `apps/web-1` (Status Guidance Card, Copy Map)

---

## 1. Bản chất Vấn Đề (Problem Statement & Deep Trace)

Qua điều tra thực tế trực tiếp từ Production Database (`cases`, `ai_jobs`, `credit_ledgers`, `lifecycle_units`) trên case cụ thể **`NX-469518`**, phát hiện **2 vấn đề độc lập** làm sập trải nghiệm người dùng:

### Vấn đề A: Lỗi Logic Giao diện (Frontend Copy Leak)
* **Hiện trạng:** Sau khi nộp intake thành công, giao diện chuyển về trang case và hiện thông báo:
  > *"Hồ sơ đã gửi thành công — Chờ xét duyệt. Đội ngũ Nexus đang kiểm tra hồ sơ và phân công Supporter chuyên môn phụ trách dự án trong 12 đến 24 giờ. Hiện tại bạn không cần làm gì thêm."*
* **Nguyên nhân:** File `statusCopyMap.ts` và `StatusGuidanceCard.tsx` dùng chung 1 static copy cho stage `submitted` từ thời V1 (khi chỉ có gói người chấm). Hệ thống không kiểm tra `package_id` (`pkg_ai_audit` vs `pkg_supporter_audit`).
* **Hậu quả:** Đối với gói 79k (AI thuần túy), thông báo "phân công Supporter" gây hiểu lầm nghiêm trọng cho sinh viên rằng case chưa chạy và phải đợi người duyệt.

### Vấn đề B: Lỗi Khối Giao Dịch Postgres ở Backend (Backend Transaction Abort)
* **Hiện trạng:** Dù case còn đủ **2 credits**, khi nộp intake xong, Nexus AI Engine (OMP Worker) **hoàn toàn không được kích hoạt**, không có job nào được dispatch vào BullMQ.
* **Nguyên nhân gốc rễ (Root Cause):**
  1. File `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts` tại dòng 362–375: Khi một job trước đó có status là `failed` hoặc `cancelled`, code kiểm tra:
     ```typescript
     const sameTriggerIntent =
       previousStartedAt !== null &&
       previousSubmissionType === submissionType &&
       previousLifecycleUnitId === (lifecycleUnitId ?? null);
     const startedAt = sameTriggerIntent ? previousStartedAt! : new Date().toISOString();
     const idempotencyKey = `audit-trigger-${caseId}-${startedAt}`;
     ```
  2. Khi sinh viên nộp intake lại lần 2, do lần 1 đã fail ở ngày 15/09, `sameTriggerIntent` trả về `true`. Code tái sử dụng lại đúng timestamp cũ `2026-09-15T13:05:58.123Z`.
  3. Khi thực hiện trừ credit trong Postgres transaction:
     ```typescript
     await prisma.$transaction(async (tx) => {
       ...
       try {
         await createCreditEntry(tx, { ..., idempotencyKey });
       } catch (err) {
         if (err.code === "P2002") { skipCharge = true; } // CỐ GẮNG BẮT LỖI TRÙNG KEY
       }
       await tx.aiJob.upsert({ ... }); // <-- LỆNH NÀY CHẾT NGAY LẬP TỨC
     })
     ```
  4. **Quy tắc bất biến của PostgreSQL:** Khi một câu lệnh bên trong một transaction block gặp lỗi constraint (`P2002 - Unique constraint failed on idempotency_key`), Postgres **ngay lập tức đánh dấu transaction ở trạng thái Aborted (`current transaction is aborted, commands ignored until end of transaction block`)**. Việc dùng `try/catch` trong Node.js/TypeScript không thể phục hồi được transaction!
  5. Lệnh kế tiếp `tx.aiJob.upsert` bị Postgres từ chối và quăng exception làm rollback toàn bộ transaction.
  6. Trong khi đó, ở `apps/api/src/modules/cases/application/submit-intake.usecase.ts`:
     ```typescript
     try {
       await triggerOmpAuditForCase(caseId, { submission_type: "initial" });
     } catch (triggerErr) {
       logger.info({ caseId, err: triggerErr }, "OMP audit not triggered on intake submission...");
     }
     ```
     Lỗi này bị nuốt (`swallowed`) ở mức log `info`, luồng intake kết thúc trả về `submitted` cho frontend như thể không có gì xảy ra.

---

## 2. So Sánh & Đánh Giá Các Hướng Giải Quyết (Approaches & Trade-offs)

### Cho Vấn Đề B (Backend Transaction & Trigger AI)

| Tiêu chí | Hướng 1: Savepoint / Nested Tx | Hướng 2: Mint Fresh Timestamp cho Retry (Khuyên dùng) | Hướng 3: Pre-check Key ngoài Tx |
|---|---|---|---|
| **Cơ chế** | Sử dụng Savepoint của Postgres để catch P2002 mà không abort transaction | Vì job `failed` đã được hoàn tiền (`refund`) ngay khi fail, mỗi lần trigger mới LUÔN là 1 vòng đời mới $\rightarrow$ Luôn tạo `startedAt = new Date().toISOString()`. | Query `findUnique` xem key đã tồn tại chưa trước khi insert |
| **Độ phức tạp** | Cao (Prisma không hỗ trợ native savepoint mượt mà). | Thấp, triệt để, đúng bản chất tài chính. | Trung bình, vẫn dính TOCTOU race condition nếu 2 request tới cùng lúc. |
| **Bản chất nghiệp vụ** | Cố chấp giữ lại timestamp cũ của ngày hôm trước. | Chuẩn xác: Một lần nộp bài mới là một lượt chạy mới, trừ 1 credit mới (hệ thống đã refund credit cũ rồi). | Vá víu bề mặt. |
| **Rủi ro** | Postgres driver dễ leak state. | Không có rủi ro trùng lặp. | Vẫn có thể dính P2002 nếu concurrent. |

$\rightarrow$ **Quyết định Hướng 2:** Loại bỏ việc tái sử dụng `previousStartedAt` khi job trước đã kết thúc (`failed`/`cancelled`). Mỗi lần user yêu cầu thẩm định mới (qua nộp intake hoặc bấm retry), luôn cấp một `startedAt` mới, trừ 1 credit mới theo đúng số dư thực tế trong ví/case. Đồng thời loại bỏ try/catch nuốt P2002 vô nghĩa trong transaction.

### Cho Vấn Đề A (Frontend Status Guidance Copy)

| Tiêu chí | Hướng 1: Gộp chung và sửa text chung chung | Hướng 2: Phân nhánh theo `package_id` (Khuyên dùng) |
|---|---|---|
| **Cơ chế** | Sửa câu văn thành: "Hồ sơ đang được xử lý hoặc phân công supporter..." | `StatusGuidanceCard` kiểm tra nếu `package_id === 'pkg_ai_audit'` thì render copy riêng của AI, ngược lại render copy của Supporter. |
| **Trải nghiệm (UX)** | Lơ lửng, người dùng gói 79k vẫn không biết ai đang làm gì. | Minh bạch, chính xác 100%: Gói 79k thấy "Đang thẩm định bởi Nexus AI", gói 149k thấy "Đang phân công Supporter". |
| **Độ phức tạp** | Rất thấp. | Thấp (chỉ thêm 1 hàm helper hoặc phân nhánh trong `StatusGuidanceCard.tsx`). |

$\rightarrow$ **Quyết định Hướng 2:** Phân nhánh rõ ràng theo gói dịch vụ.

---

## 3. Bản Thiết Kế Chuẩn Production (Production Architecture Design)

### Module 1: Backend Fix (`apps/api`)
1. **`omp-audit-coordinator.ts`**:
   - Định nghĩa lại `startedAt`: Luôn luôn tạo `startedAt = new Date().toISOString()`.
   - Bỏ đoạn logic `sameTriggerIntent` và tái sử dụng `previousStartedAt` gây lỗi P2002.
   - Bỏ khối `try/catch` bọc `createCreditEntry` bên trong transaction (nếu có lỗi constraint thì fail fast, không để transaction bị hỏng dở dang).
   - Đảm bảo khi `triggerOmpAuditForCase` chạy:
     1. Lock case bằng `FOR UPDATE`.
     2. Kiểm tra số dư `inTxBalance >= 1`.
     3. Insert `CreditLedger` (-1 credit).
     4. Upsert `AiJob` sang status `queued`.
     5. Cập nhật case stage sang `under_review`.
     6. Dispatch BullMQ job `omp-worker`.
2. **`submit-intake.usecase.ts`**:
   - Ghi log rõ ràng nếu `triggerOmpAuditForCase` ném lỗi, không nuốt lỗi âm thầm bằng `logger.info`. Nếu lỗi là do thiếu credit thì đó là luồng bình thường (402), còn nếu lỗi hạ tầng thì log `error` có stack trace.

### Module 2: Frontend Fix (`apps/web-1`)
1. **`statusCopyMap.ts` / `StatusGuidanceCard.tsx`**:
   - Thêm cấu hình riêng cho AI package ở stage `submitted`:
     - **Title:** `"Hồ sơ đang chờ xử lý bởi Nexus AI"`
     - **Description:** `"Hệ thống đã tiếp nhận hồ sơ và đang khởi động tiến trình thẩm định tự động qua Nexus AI Engine. Kết quả phản biện chi tiết sẽ có trong ít phút."`
     - **Tone:** `"info"`
     - **Icon:** `"activity"`
   - Gói người chấm (`pkg_supporter_audit`) giữ nguyên thông điệp phân công Supporter trong 24h-48h.

---

## 4. Kế Hoạch Xác Minh & Đo Lường (Verification & Production Standards)

1. **Unit Test Backend:**
   - Viết test trong `apps/api/src/shared/infrastructure/tests/omp-audit-trigger.test.ts` mô phỏng:
     - Case đã từng fail job trước đó $\rightarrow$ trigger lần 2 $\rightarrow$ đảm bảo trừ credit thành công, job chuyển sang `queued`, không dính lỗi abort transaction.
2. **Chạy Thực Nghiệm trên case `NX-469518`:**
   - Sử dụng endpoint `/api/cases/:id/ai-retry` để trigger lại case này trên dev/staging, kiểm tra DB xem:
     - `credit_ledgers` được trừ -1 credit hợp lệ.
     - `ai_jobs` chuyển sang `queued`.
     - `cases.user_facing_stage` chuyển sang `under_review`.
3. **Kiểm tra Type-Safety:**
   - Chạy `bun run check-types` trên toàn bộ monorepo, cam kết 0 warning/0 error.
