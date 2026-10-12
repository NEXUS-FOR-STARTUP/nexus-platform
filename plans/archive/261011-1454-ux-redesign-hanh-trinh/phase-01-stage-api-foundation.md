# Phase 1 — Stage API foundation

## Context Links
- [plan.md](./plan.md)
- `apps/api/src/modules/cases/application/submit-revision.usecase.ts:57-85` (`selectCheckpoint`)
- `apps/api/src/modules/cases/application/open-checkpoint.usecase.ts:8-16`
- `apps/api/src/modules/packages/**` (controller, list/get usecase, repository)
- `apps/api/src/modules/cases/infrastructure/persistence/credit-ledger.repository.ts:39-78`
- `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts:259-430`
- `packages/shared/src/audit-checkpoints.ts`, `prisma/seeds/seed-active-packages.ts:46-136`

## Overview
- Priority: P1, chặn mọi phase sau.
- Status: Pending.
- Thêm các API mà UI theo giai đoạn cần. Tất cả thay đổi tương thích ngược.

## Key Insights
- **Lỗi thật:** file sinh viên tải lên luôn rơi vào CP1. `selectCheckpoint` chọn theo `current_checkpoint`, mà `open-checkpoint` cố ý giữ giá trị này ở CP1. Vì vậy `loadAttachments` của CP2 không bao giờ nhận file sinh viên.
- `GET /packages` trả nguyên dòng DB: không có `service_type`, giá lấy từ cột `price` chứ không phải tier hiện hành. `GET /packages/:id` cũng thiếu `service_type`, `credits_granted`.
- `credit_ledger` trong case detail bị bỏ `service_type` ở biên API.
- `Checkpoint.checkpoint_status` chỉ ghi một lần (`update: {}`), không dùng được làm trạng thái.
- Job chấm có `input_json.checkpoint`; job CP1 cũ không có → mặc định CP1 (`omp-audit-finalizer.ts:128-131`).

## Requirements
Functional:
1. **Endpoint upload mới** `POST /cases/:id/stages/:checkpoint_code/documents`. Không mở rộng `/revisions/upload`, vì usecase đó chạy `T9_SUBMIT_REVISION` trong cùng transaction (`submit-revision.usecase.ts:180-186`). T9 chỉ hợp lệ từ `waiting_user` / `report_ready_to_publish` (`case-machine.ts:173,193`) và đẩy case sang `supporter_working`, nên upload theo giai đoạn sẽ bị từ chối ở hầu hết trạng thái, hoặc kéo case vào luồng supporter.
   - Dùng lại `submitCaseRevisionInTx` (tạo lifecycle unit + document record trên checkpoint) **không chạy transition**.
   - Owner-only; chỉ nhận `checkpoint_code` có `available: true` trong `STAGES` (giai đoạn sắp ra mắt → 400); `ensureCheckpoint` bằng upsert theo `(case_id, checkpoint_code)`.
   - Chặn khi `internal_status = 'cancelled'` → `409 CASE_CLOSED`. Không chặn khi đang chấm: job đã chép input lúc trigger.
   - `/revisions/upload` cũ giữ nguyên cho workspace cũ (flag tắt).
2. `GET /packages` và `GET /packages/:id` trả `{ id, name, price (tier hiện hành), credits_granted, service_type: { code, name } | null, is_active }`.
3. Ledger trong case detail có thêm `service_type_code`.
4. `GET /cases/:id/stages` → `{ stages: StageSummary[], active_audit: { checkpoint_code } | null }`, với `StageSummary = { checkpoint_code, status, answered_count, file_count, latest_report: { id, report_type, created_at } | null }`.
   `status` ∈ `not_started | drafting | files_submitted | grading | has_result`.
5. Lỗi `409 AUDIT_IN_PROGRESS` kèm `details.checkpoint_code` của job đang chạy.
6. Seed đổi `service_types.name` thành tên hiển thị: `Chấm bài Ý tưởng`, `Chấm bài Thị trường`.

Non-functional: không migration; owner-only như các route case khác; log JSON có `case_id`, `checkpoint_code`.

## Architecture
- **Stage registry dùng chung** `packages/shared/src/stages.ts`: `STAGES = [{ code: 'CP1', slug: 'y-tuong', name: 'Ý tưởng', serviceType: 'cp1_audit', templateKey: 'cp1', available: true }, …CP4 available: false]`. Đây là nguồn duy nhất cho tên hiển thị, slug URL, thứ tự, mã dịch vụ. `audit-checkpoints.ts` giữ nguyên vai trò plan chấm.
- `deriveStageSummaries(caseId)` là hàm đọc thuần trong `cases/application/`, gồm 4 truy vấn gom nhóm, không N+1:
  - `Checkpoint` theo `case_id`.
  - `DocumentRecord` đếm theo `checkpoint_id`, `superseded_at IS NULL`, `source_kind <> 'generated'`, loại trừ `assessment_report | supporter_output | supporter_attachment | payment_proof`. Dùng chung hằng số với `loadAttachments`.
  - `ProjectAnswer` theo `case_id`; đếm theo tiền tố `question_id`, bỏ `cp2_selfcheck_*`, chỉ tính câu không rỗng.
  - `AiJob` mới nhất `queued|processing` theo case + `Report` mới nhất theo `checkpoint_id`.
- Thứ tự ưu tiên trạng thái: `grading` > `has_result` > `files_submitted` > `drafting` > `not_started`.
- Upload: usecase mới `upload-stage-documents.usecase.ts` gọi `submitCaseRevisionInTx`, không gọi `transitionInTx`; `version_no` tăng theo checkpoint (`latest_version_no + 1`) trong transaction.

## Related Code Files
Sửa:
- `apps/api/src/modules/cases/application/submit-revision.usecase.ts`, `cases.dto.ts` / validation schema của upload
- `apps/api/src/modules/packages/application/list-packages.usecase.ts`, `get-package.usecase.ts`, `infrastructure/persistence/package.repository.ts`
- `apps/api/src/modules/cases/infrastructure/persistence/credit-ledger.repository.ts`, `application/get-case-detail.usecase.ts`
- `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts` (details lỗi 409)
- `apps/api/src/modules/cases/http/cases.routes.ts`, `cases.controller.ts`
- `prisma/seeds/seed-active-packages.ts`
- `apps/web-1/types/case.ts` (`CreditLedger.service_type_code`)

Tạo:
- `packages/shared/src/stages.ts` (+ export ở `index.ts`)
- `apps/api/src/modules/cases/application/derive-stage-summaries.ts`
- `apps/api/src/shared/infrastructure/tests/stage-summaries.test.ts`
- `apps/api/src/shared/infrastructure/tests/revision-upload-checkpoint.test.ts`

## Implementation Steps
1. Tạo `stages.ts`; export `StageCode`, `StageSlug`, `findStageBySlug`, `findStageByServiceType`.
2. Upload: route + usecase mới; validate `checkpoint_code` theo `STAGES.available`; log `case_id`, `checkpoint_code`, số file.
3. Packages: repository `include: { service_type: { select: { code, name } }, pricing_tiers: { where: { is_current: true }, take: 1 } }`; usecase map ra DTO cố định (không trả nguyên dòng DB).
4. Ledger: select thêm `service_type: { select: { code } }`, map ra `service_type_code`.
5. `deriveStageSummaries` + route `GET /cases/:id/stages` (owner guard như `GET /cases/:id`).
6. Coordinator: khi ném `AUDIT_IN_PROGRESS`, đọc `input_json.checkpoint ?? 'CP1'` của job đang chạy, gắn vào `details`.
7. Seed: đổi tên 2 service type. Chạy seed trên DB local, không chạy trên prod trong phase này.
8. Test: thứ tự ưu tiên trạng thái; câu trả lời rỗng và self-check không được tính; upload CP2 rơi vào checkpoint CP2 và **không đổi `internal_status`**; CP2 chưa có dòng checkpoint thì được tạo; CP3 → 400; case cancelled → 409; `/revisions/upload` cũ không đổi hành vi.

## Todo List
- [ ] `stages.ts` registry
- [ ] Endpoint upload theo giai đoạn (không transition)
- [ ] Packages DTO có service_type, credits, giá hiện hành
- [ ] Ledger có `service_type_code`
- [ ] `GET /cases/:id/stages`
- [ ] `AUDIT_IN_PROGRESS.details.checkpoint_code`
- [ ] Seed tên hiển thị
- [ ] Test

## Success Criteria
- Tải file vào Thị trường → `DocumentRecord.checkpoint_id` là dòng CP2, stage case không đổi; job chấm CP2 thấy file trong `attachments/`.
- `GET /cases/:id/stages` trả đúng 5 trạng thái trên dữ liệu thử.
- `/revisions/upload` cũ chạy như trước.

## Risks
- Trạng thái suy ra phụ thuộc quy ước tiền tố `question_id`. Đã kiểm tra: mọi id trong catalog có tiền tố `cpN_`. Thêm assert trong test catalog.
