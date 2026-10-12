# Phase 4 — CP2 checkpoint lifecycle

## Context (scout)
- Hardcode CP1 ở writers:
  - `cases/infrastructure/persistence/case.repository.ts:180,187` — tạo case + CP1
  - `cases/application/submit-intake.usecase.ts:50-70` — fallback tạo CP1
  - `guided-documents/application/generate-docx.usecase.ts:33-54,122-125` — tìm checkpoint theo `templateKey.toUpperCase()`, không có thì `checkpoints[0]`; lazy-create CP1
  - `reports/infrastructure/persistence/report.repository.ts:148-191` — `resolveOmpAuditCheckpoint` fallback tạo CP1
  - `services/case-transition.service.ts:73-100` — `upsertDoc` theo `current_checkpoint`
- Readers đã đa checkpoint: `documents/application/assemble-document-workspace.ts:86-112`.
- Không có unique `(case_id, checkpoint_code)`.

## Overview
Priority P1. Nền cho phase 5, 6. Hiện không API nào tạo được checkpoint CP2.

## Requirements
- `@@unique([case_id, checkpoint_code])` trên `Checkpoint`. Trước migration: query kiểm tra trùng trên DB (read-only). Có trùng -> dừng, báo user.
- Hàm `ensureCheckpoint(tx, caseId, code)` (upsert theo unique) thay mọi lazy-create CP1.
- `generate-docx`: dùng `ensureCheckpoint(templateKey.toUpperCase())`; bỏ fallback `checkpoints[0]` (gây ghi docx CP2 vào CP1).
- `POST /cases/:id/checkpoints/CP2/open` (owner): ensure CP2, set `current_checkpoint = CP2`. Không cần CP1 hoàn tất.
- Định nghĩa `current_checkpoint`: checkpoint đang làm việc; audit/report mặc định theo nó, nhưng audit CP2 truyền code tường minh (phase 6).
- Case tạo mới cho nhóm vào thẳng CP2: case vẫn tạo bình thường (CP1 row có thể rỗng), rồi mở CP2. Không đổi flow tạo case.
- UI: trong workspace, thẻ CP2 hiện nút "Bắt đầu Checkpoint 2" khi chưa mở; mở rồi vào `?tab=guided&template=cp2`.

## Steps
1. Read-only query trùng `(case_id, checkpoint_code)` qua READONLY_DATABASE_URL (`docs/db-query-guide.md`).
2. Schema unique + `--create-only`.
3. `ensureCheckpoint` trong case repository; thay 4 điểm lazy-create.
4. Route + usecase open CP2 + zod.
5. Web hook + nút.
6. Tests: open CP2 idempotent; docx cp2 ghi vào checkpoint CP2; report fallback không tạo CP1 thừa.

## Todo
- [ ] Kiểm trùng
- [ ] Unique
- [ ] ensureCheckpoint
- [ ] Open CP2 API
- [ ] UI
- [ ] Tests

## Success criteria
Smoke local: case có CP1 -> mở CP2 -> soạn + xuất docx CP2 -> DocumentRecord có `checkpoint_id` của CP2.

## Risks
- Flow CP1 đang đọc `current_checkpoint`: đổi sang CP2 có thể làm trang CP1 (tab báo cáo/tài liệu) hiển thị CP2. Kiểm tra mọi reader `current_checkpoint` ở web trước khi đổi; nếu nhiều chỗ, chỉ lưu CP2 bằng row Checkpoint và để audit truyền code tường minh, không đổi `current_checkpoint`.
