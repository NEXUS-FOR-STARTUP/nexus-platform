# Plan nháp: dọn nền tiền vé + ví rồi fix P0 (DRAFT — chưa chốt)

> Trạng thái: DRAFT. Chưa implement. Chờ chốt phương án pay-per-trigger hay giữ vé, và thứ tự dọn vs fix P0.

## Bối cảnh

- Report gốc: `plans/reports/260915-copilot-review-pr37-79k-dual-credit.md` (9/10 threads valid).
- Report nền: `plans/reports/260915-money-matrix-ticket-wallet.md` (ma trận 7 đường ghi ledger, ví gãy atomicity 4/4 caller, 12 key 4 đỏ).
- Quyết định đã chốt: giữ model vé + ví. Ví = source of truth TIỀN, ledger = source of truth LƯỢT.

## Giai đoạn 0 — Dọn nền (làm trước, rủi ro thấp)

| Bước | Việc | File chạm | Rollback |
|---|---|---|---|
| 0.1 | Column riêng `credits_granted` (hoặc bảng `package_credits`), dual-read với `features` | `schema.prisma`, `seed-active-packages.ts`, `create-order:137-145` | Migration non-destructive, revert code về đọc JSON |
| 0.2 | Seed 149k: thêm `credits_granted` + chốt spec combo (package_id đơn trị giữ hay bảng `case_packages` n-n) | seed, `credit-audit-order.helpers.ts` | Re-seed cũ |
| 0.3 | `walletService.*` nhận `tx` ambient (JOIN), sửa 4 caller gãy: verify-deposit, sepay-webhook, create-order, (purchase cũ bỏ qua) | `wallet.service.ts`, 3 usecase | Revert từng caller, mỗi caller 1 commit |
| 0.4 | Gộp key hoàn thành 1 namespace + thêm reason/timestamp; key mua lại thêm nonce | `credit-refund.ts:28`, `case-transition:136`, `credit-audit-order.helpers:17` | Key mới chỉ cho row mới, row cũ giữ nguyên |
| 0.5 | Bật `USE_ORDER_DOMAIN=true` prod (giết W4), tắt + xóa `DUAL_WRITE_PAYMENT` block, xóa W7 + cờ env + docs | `payment.repository:177`, `create-order:73-90`, `purchase-credits.usecase`, `.env`, CHANGELOG | Bật/tắt cờ ngược lại |
| 0.6 | Sửa test hardcode 39k → đọc từ seed/giá package | `phase-07-*`, `admin-revenue-stats`, `upgrade-package` tests | Revert test |

## Giai đoạn 1 — Fix P0 trên nền sạch (song song được)

| Bước | Việc | Dựa trên | File chạm |
|---|---|---|---|
| 1.1 | T1: `SELECT FOR UPDATE cases` đầu tx + đưa guard vào trong + reuse key retry | Report PR37 thread 1 | `omp-audit-coordinator:296-346`, `credit-ledger.repository` |
| 1.2 | T3/4: guard `findFirst(unit + startedAt)`, suffix Cloudinary bằng `startedAt`/timestamp (không dùng reportId vì upload trước save) | Report PR37 thread 3/4 + advisory order | `omp-audit-finalizer:78-201`, `finalizer:141-142` |
| 1.3 | T2: persist resolved unit + payload `lifecycleUnitId`, finalizer ưu tiên `job.data`, fallback latest có filter `unit_type:'version'` | Report PR37 thread 2 + advisory filter | coordinator, `omp-queue:37-46`, finalizer, `worker-omp/omp-runner:14` |
| 1.4 | A: chốt C (queued→hoàn lượt, running→không hoàn), thêm `getOmpJobStatus` branch; lock T1 bao luôn refund | Report PR37 phụ lục A | `cancelOmpAuditForCase:436-440`, docstring 2 nơi |

## Giai đoạn 2 — Gọn cùng lượt (P2/P3)

T6 coerce `submission_type` (1 dòng BE) + B guard đầu hàm FE + test 7/8/9 + docstring 10. Không tách PR. C (CI) giữ gate thủ công.

## Câu hỏi cần chốt trước khi cook

1. Combo 149k + 79k: `package_id` đơn trị giữ hay bảng n-n? (ảnh hưởng 0.2)
2. Dọn nền trước hay fix T1 trước vì tiền đang chảy máu? (đề xuất: 0.3 + 1.1 chung 1 lượt vì cùng tx/lock)
3. `balance_after`: bỏ column hay giữ + tính trong lock? (ảnh hưởng mọi writer)
