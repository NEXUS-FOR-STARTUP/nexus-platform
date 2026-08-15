# Bug 17: Update intake mọi trạng thái hồ sơ (lui trang)

## Thông tin gốc (Google Docs)

> Có thể update [trang intake ở user] mọi trạng thái hồ sơ (BR: yêu cầu chỉ được update khi chưa gửi hồ sơ đến admin duyệt). Bằng cách lui trang về điền lại.

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Guard thiếu (FE + BE) |
| Effort | **M** |
| Độ phức tạp | Trung bình: guard status ở FE + BE |
| Dependency | #7, #18 (status flow) |
| Quyết định cần | Nhỏ — BR đã rõ: chỉ update khi chưa gửi |
| Vùng code | Intake form — `apps/web-1/app/dashboard/intake/` + API update guard |

## Tracking

| Field | Value |
|-------|-------|
| Status | Done (2026-08-14 — plan `260814-1825-reject-resubmit-loop-fix`) |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | User lui trang → điền lại → update được kể cả khi đã gửi. Chặn update khi case đã gửi admin duyệt |

## Acceptance Criteria (draft)
- [x] User không update được intake khi hồ sơ đã gửi (guard FE + BE)
- [x] Hiển thị trạng thái khóa/chặn khi không được phép update

> **Done note:** BE guard `submit-intake` — chỉ `triage_pending`/`cancelled` (else 400 `INVALID_CASE_STAGE`), `waiting_user` → 409 `REVISION_REQUIRED`; FE gating theo `filterTransitions`.
