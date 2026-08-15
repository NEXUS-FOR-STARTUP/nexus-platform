# Reject → Resubmit Loop Fix — nối code vào machine có sẵn, đóng 6 bug

**Date**: 2026-08-14
**Status**: Completed (6/6 phases) — chờ plan-close
**Component**: apps/api (workflow machine) + apps/web-1 (student/supporter/admin UI)
**Plan**: 260814-1825-reject-resubmit-loop-fix (P0, effort 22h, branch `feat/reject-resubmit-loop-fix`)

## What Happened

Vòng "admin từ chối → sinh viên sửa → nộp lại" kẹt end-to-end, 3 bề mặt rời, machine không được gọi:

1. Sửa hồ sơ (`/intake`): ghi thẳng `user_facing_stage="submitted"`, bỏ qua machine → `internal_status` vẫn `cancelled` (terminal) → dead state. `[đã kiểm chứng]` submit-intake.usecase.ts:91-98
2. Nộp lại (`/resubmit`): fire T3/T4 không mang data → content nộp lại bị nuốt; route luôn fire T3, T4 unreachable; không FE gọi. resubmit-case.usecase.ts:22-27
3. FE: card rejected chỉ có nút "Chỉnh sửa hồ sơ", không có nút nộp lại thật sự.

Bản chất: machine **đã định sẵn T12/T3/T4** từ trước. Đây là gap luồng sản phẩm + code bỏ dở, KHÔNG phải lỗi kiến trúc. **Nối code vào machine có sẵn, KHÔNG thiết kế lại.**

## Key Decisions (D1-D20, locked 2026-08-14)

| # | Quyết định |
|---|-----------|
| D1 | Admin còn **1 nút "Từ chối"**; xóa request-more-info (FE + endpoint + usecase admin). Lý do từ chối ≥10 ký tự, hiện cho sinh viên (T12 bắt buộc) |
| D3 | **1 action atomic** qua `POST /intake`: lưu content + transition cùng 1 tx |
| D4 | T3 vs T4 theo **sự kiện gần nhất**: `vetoed` → T4; ngược lại → T3 |
| D5 | Veto refund **VND-only**, KHÔNG đụng creditLedger. Nộp lại thì mua credit lại bằng tiền vừa hoàn |
| D6 | Done **khóa hết**: bỏ T3/T4 khỏi state `done` |
| D8 | `TARGET_STAGE[T16] = intake_ready` — sửa nháp không demote |
| D16 | Chat = đặc quyền **trả phí**, chỉ sau accept. Gate chung student + supporter + admin, không bypass; timer derive từ data, không migration |
| D17 | Reject→resubmit immutability: sửa CẢ doc (upsert v00) + string log + noti; **mid-review FROZEN** (chỉ T9 revision) |
| FIX-6 | `transitionInTx` **bắt buộc** — latent bug: `executeTransition` có param `client?` nhưng L190-192 gọi `db.$transaction` → truyền TransactionClient sẽ crash |

## What Was Built

6 phases: Machine Amendments → BE Reject-Resubmit Loop + Wiring → BE Admin allowed_transitions → FE Student Workspace → FE Supporter Action Bar → FE Admin Modal + Regression. Commits `0326e7a` (feat) + `d64f351` (docs) trên `feat/workflow-engine-refactor`, PR merged vào line workflow (PR #16 sau này kế thừa).

## Impact

- Đóng bug **#2 #4 #7 #15 #17 #18**; hỗ trợ #12 (dedupe v00: upsert unit + `upsertDocumentRecordsForUnit`, hết double-write)
- AppError codes mới: `INVALID_TRANSITION`, `NO_CREDITS` (402), `DUPLICATE_CREDIT_CONSUMPTION` (409 — P2002, không còn 500)
- FE nút render từ `allowed_transitions` / `filterTransitions` (actor-aware, 3 role); xóa `isValidStageTransition` (0 caller); xóa `updateStageMutation` (dead — payload sai key BE, luôn 400)
- Dữ liệu prod đếm read-only: **0 case kẹt vĩnh viễn** → không cần phase data repair; case rejected hiện tại tự gỡ khi feature chạy

## Known Leftovers

- Bonus #15 (gói free vs Premium) → ngoài scope, business decision
- SLA / "chat ưu đãi thêm thời gian" → feature tương lai riêng

## Unresolved

None.
