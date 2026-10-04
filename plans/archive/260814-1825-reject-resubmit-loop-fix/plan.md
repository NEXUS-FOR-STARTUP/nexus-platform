---
title: "Reject → Resubmit Loop Fix — sửa vòng từ chối → nộp lại + hoàn thiện wiring machine"
description: "Primary: vòng 'admin từ chối → sinh viên sửa → nộp lại' đang kẹt end-to-end (3 bề mặt rời, machine không được gọi). Secondary: wire nốt T2/T16/T11/T9 qua machine, xóa isValidStageTransition (F11), FE render nút từ allowed_transitions. Đóng bug #2 #4 #7 #15 #17 #18, hỗ trợ #12."
status: done
priority: P0
effort: 22h
branch: feat/reject-resubmit-loop-fix
tags: [workflow, xstate, backend, frontend, bug-fix]
blockedBy: []
blocks: []
created: 2026-08-14
---

# Reject → Resubmit Loop Fix

## Overview

**Vấn đề chính (P0):** luồng "admin từ chối → sinh viên sửa → nộp lại" không tồn tại end-to-end. Ba bề mặt rời nhau, không nối với nhau:

1. Sửa hồ sơ (`/intake`): ghi thẳng `user_facing_stage="submitted"`, bỏ qua machine, `internal_status` vẫn `cancelled` (terminal) → dead state. `[đã kiểm chứng]` submit-intake.usecase.ts:91-98
2. Nộp lại (`/resubmit`): fire T3/T4 nhưng không mang data → content nộp lại bị nuốt; route luôn fire T3, T4 unreachable; không FE gọi. `[đã kiểm chứng]` resubmit-case.usecase.ts:22-27, cases.controller.ts:546, useCaseDetails.ts:72-81
3. FE: card rejected chỉ có nút "Chỉnh sửa hồ sơ", không có nút nộp lại thật sự.

**Bản chất:** machine ĐÃ định sẵn T12/T3/T4 từ trước. Đây là **gap luồng sản phẩm + code bỏ dở**, KHÔNG phải lỗi kiến trúc. Không cần thiết kế lại machine; chỉ nối code vào nó.

**Vấn đề phụ:** T2/T16/T11/T9 chưa wire, F11 còn tồn tại, FE hardcode nút theo stage.

Nghiên cứu nền: `plans/reports/explorer-admin-reject-vs-request-info.md`, `plans/reports/debugger-plan-review-rca.md`, `plans/reports/brainstorm-260814-reject-clarify-root-cause.md`, `plans/reports/researcher-be-wiring-gaps.md`, `plans/reports/researcher-fe-consumers-gaps.md`.

## Quyết định đã chốt (brainstorm 2026-08-14)

| # | Chủ đề | Quyết định |
|---|--------|-----------|
| D1 | Nút admin | Admin chỉ còn **1 nút "Từ chối"**. Xóa nút "Yêu cầu làm rõ" (FE) + endpoint + use case admin request-more-info. Lý do từ chối = công cụ "yêu cầu làm rõ" — phải hiện cho sinh viên |
| D2 | Chặn vĩnh viễn | Không có. Sinh viên luôn được nộp lại. Trường hợp chặn thật → liên hệ ngoài hệ thống |
| D3 | Nộp lại | **1 action atomic** qua `POST /intake`: lưu content + transition trong cùng 1 tx (proposal 1 nút — xem mục Chưa chốt) |
| D4 | T3 vs T4 | Theo sự kiện gần nhất: `vetoed` → T4; ngược lại → T3 |
| D5 | Veto refund | Hoàn thẳng **VND** vào ví (giữ nguyên logic hiện tại). **KHÔNG đụng creditLedger** — không zero credit, không hoàn credit. Nộp lại thì mua credit lại bằng tiền vừa hoàn |
| D6 | Done | Khoá hết: bỏ T3/T4 khỏi state `done` |
| D7 | Content write | Use case sở hữu mọi doc write. Transition data **không mang files** → upsertDoc executor no-op → hết double-write sai doc_type |
| D8 | T16 | `TARGET_STAGE[T16] = intake_ready` — sửa nháp không demote |
| D9 | Credit | Lifecycle giữ nguyên (mua SAU tạo case qua orders, check T5, trừ T11). Bỏ `requireCredits` ở intake. **Audit `requireCredits` — đang mâu thuẫn với machine `hasCredit`** (xem D15) |
| D10 | Supporter request-info | Giữ nguyên (giữa chừng `supporter_working` ↔ `waiting_user`). Fix hiển thị text yêu cầu cho sinh viên |
| D11 | transitionInTx | Design chính (Prisma TransactionClient không có `$transaction`). P2002 → 409 DUPLICATE_CREDIT_CONSUMPTION. Idempotency key `buildVersionUnitCode` (v01 padded) |
| D12 | F11 + assign | Xóa `isValidStageTransition` + fallback. T6 + assignCaseSupporter gộp 1 tx. T6 self-loop mang action emitStageChanged |
| D13 | v00 dedupe | `/intake` upsert unit v00 + `upsertDocumentRecordsForUnit` (gốc bug #12) |
| D14 | Gate FE | `filterTransitions` actor-aware (role + owner/member/assignedSupporter) |
| D15 | `requireCredits` audit | Sửa mâu thuẫn `requireCredits` (case.types.ts:77-90) vs machine `hasCredit`. Bug: free case (`locked_price=0`) bị 402 ở resubmit intake (`submit-intake:22`), revision (`submit-revision:151,306`), chat (`send-message:37`). Bỏ `requireCredits` khỏi intake + revision (machine guard lo); chat chuyển sang D16 |
| D16 | Chat access rule | Chat là đặc quyền **trả phí**, chỉ sau accept. Gate CHUNG cho student + supporter + admin (không bypass): free case → đóng; `rejected` → đóng; `closed` → đóng; credit>0 → mở; hết credit → khóa 1 ngày rồi mở lại; complete khi còn credit → mở thêm 1 ngày rồi đóng; complete khi đã hết credit → không đếm lại. Mọi liên hệ khi chat đóng = **ngoài hệ thống** (email/phone). Triage giao tiếp qua admin reject reason (T12 bắt buộc ≥10 ký tự + hiển thị cho student); mid-review qua T8 request-info + chat. Timer derive từ data, không migration |
| D17 | Reject→resubmit immutability | **Chốt A**: reject ở triage (chưa review) → sửa CẢ doc + string. Docs qua `upsertDocumentRecordsForUnit` trên v00 (replace-same/append), string log + noti. Mid-review FROZEN (chỉ T9 revision) — guard `isBeforeSubmission` giữ nguyên |

## Kết luận design vs code (đã kiểm chứng)

Thiết kế (machine + document-contract) ĐÃ đúng: reject/resubmit/veto lifecycle, guard `isBeforeSubmission` cấm sửa sau nộp, document immutable-by-version (`v00` intake → `vNN` revision). **Toàn bộ blocker là code bypass thiết kế**, không phải lỗi thiết kế. Plan này = nối code vào machine đã có, KHÔNG thiết kế lại.

- `T16_EDIT_INTAKE` guard `isBeforeSubmission` → design đã chặn sửa hồ sơ mid-review. `submit-intake` bypass machine nên không tôn trọng → đây là bug code.
- `refundCredit` thiếu credit zeroing → bug code (VND có, credit không).
- Document "thay thế tài liệu chính" = `upsertDocumentRecordsForUnit` (ID deterministic), "lấy mới nhất" = version unit cao nhất — đều đã có, chỉ cần code đi đúng.

## Dữ liệu prod hiện tại (đã đếm read-only 2026-08-14)

| Check | Kết quả | Xử lý |
|---|---|---|
| Kẹt A `cancelled+submitted` | **0 case** | — |
| Kẹt B `waiting_user+null supporter` | **0 case** | — |
| `cancelled+rejected` (chờ nộp lại) | **1 case** (NX-166772, b08054ea) — T12_REJECT 2026-08-14 | Tự gỡ khi phase-02/04 xong (nút nộp lại + backend). Không cần sửa data |
| Trùng 2 unit v00 | **1 case** (NX-875164, 76fc90f6, `report_ready_to_publish`) — intake nộp lại 2 lần tạo 2 v00 | Vô hại (case đã qua intake stage). Để nguyên, không cần sửa data |
| Tổng case | 20 (11 `triage_pending+submitted` bình thường) | — |

→ **KẾT LUẬN: KHÔNG cần phase data repair.** Zero case kẹt vĩnh viễn. Case rejected hiện tại sẽ tự gỡ khi feature nộp lại hoạt động. Trùng v00 là data noise vô hại, bỏ qua.

## Chưa chốt

Không còn gì. Mọi quyết định đã khóa (D1-D17). Có thể bắt đầu implement.

## Amendments (sau explore verify — 2026-08-14)

| # | Nội dung | Lý do |
|---|---|---|
| D18 | Nộp intake/revision: **owner-only** (user chốt). `isOwnerOrMember` thực tế === `isOwner` → đổi tên guard thành `isOwner`, KHÔNG extend memberIds. Usecase membership check đổi thành owner check cho consistency | Machine guard không check member; event data không có memberIds |
| D19 | Bare `POST /cases/:id/revisions` (`submitRevisionUseCase`): **giữ nguyên behavior** (vẫn T9 + data.files), chỉ comment deprecated. Không đụng code | User chốt; tránh đổi behavior endpoint cũ |
| D20 | `updateStageMutation` (useCaseDetails.ts:31): **xóa** — payload `{stage,status}` sai key BE (`user_facing_stage`/`internal_status`) → luôn 400, zero caller. Phase-05 dùng `useSupporterActions` mới | Dead code hỏng |
| FIX-1 | Mọi chỗ plan ghi event `'vetoed'` → **`'T13_VETO'`** (và `'case_rejected'` → `'T12_REJECT'`). `executeTransition` ghi `event_type = transitionName` | grep `vetoed` trong apps/api = 0 hits; StatusGuidanceCard.tsx:36-42 phải match T12_REJECT/T13_VETO |
| FIX-2 | Phase-02 todo "refundCredit: creditLedger -= 1" mâu thuẫn D5 → **xóa todo, giữ VND-only** (D5 thắng) | Mâu thuẫn nội bộ trong phase file |
| FIX-3 | `findOpenRequestsForMoreInfo` match thêm `request_more_info` **và** `case_closed` (để student thấy event đóng case) | Repo fn hiện chỉ match `more_info_requested` |
| FIX-4 | `requestCaseMoreInfo` repo fn: **GIỮ** (supporter request-info + close-case vẫn dùng). Chỉ xóa usecase+handler+route admin | Explore verify: 2 caller còn lại |
| FIX-5 | Free case: v00 + intake docs **được tạo lúc create** (case.repository.ts:179-218) → upsert (không create-if-missing) là đúng primitive cho resubmit, mọi case đều có sẵn v00 | Tránh tạo v00 thứ 2 |
| FIX-6 | `executeTransition` có param `client?` nhưng L190-192 gọi `db.$transaction` → truyền TransactionClient sẽ crash. Phase-02 split `transitionInTx` là **bắt buộc** (fix latent bug), không optional | Explore verify L187-192 |

## Đã loại khỏi scope

- **SLA / "chat ưu đãi thêm thời gian"**: feature tương lai riêng. Không đụng trong plan này.
- **1 nút vs 2 bước**: chốt **1 nút** (D3). `saveDraft` chỉ là localStorage, không có/không cần draft server.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Machine Amendments](./phase-01-machine-amendments.md) | Done | 2h |
| 2 | [BE Reject-Resubmit Loop + Wiring](./phase-02-be-reject-resubmit-loop.md) | Done | 8h |
| 3 | [BE Admin allowed_transitions](./phase-03-be-admin-allowed-transitions.md) | Done | 1h |
| 4 | [FE Student Workspace](./phase-04-fe-student-workspace.md) | Done | 4h |
| 5 | [FE Supporter Action Bar](./phase-05-fe-supporter-action-bar.md) | Done | 4h |
| 6 | [FE Admin Modal + Regression](./phase-06-fe-admin-regression.md) | Done | 3h |

## Dependencies

- Prisma 7: `transitionInTx(tx, params)` nhận `Prisma.TransactionClient` trực tiếp (D11 — design duy nhất, không spike)
- Tiền đề đã xong: plan 260809 (machine + service), 260813 (settings, completed)
- Bug đóng kỳ vọng: #2, #4, #7, #15, #17, #18; hỗ trợ #12 (dedupe v00)

## Success Criteria

- **Vòng reject → nộp lại chạy trọn**: admin từ chối (kèm lý do) → sinh viên thấy lý do → bấm "Chỉnh sửa hồ sơ để nộp lại" → sửa → bấm lưu → case về `triage_pending` → admin thấy lại trong hàng chờ
- Veto → nộp lại qua T4 (free) → mua credit lại → T5 chặn nếu hết credit
- Done: `getAvailableTransitions('done')` → `[]`
- `grep executeTransition|transitionInTx` → mọi use case đổi state đi qua (trừ documented: unassign, close-case)
- `grep isValidStageTransition` → 0 caller
- P2002 credit → 409, không 500
- FE: nút render từ `filterTransitions` (3 role); `canSubmitRevision` không còn 400
- Không còn double-write v00/DocumentRecord; không còn endpoint admin request-more-info
- `npm run check-types` + `npm run lint` PASS; test phase-07 mở rộng pass

## Rollback

Git-only, revert per phase (mỗi phase 1 commit gọn). Không migration DB trong plan này (creditLedger decrement là write thường, không schema change).
