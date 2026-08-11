---
title: "User Wallet VND — Ví người dùng"
description: "Bổ sung ví VND per-user bên cạnh credit. Kiến trúc 3 tầng: Wallet VND → mua credit → credit tiêu trong workflow. Nạp tiền qua SePay, mua credit bằng ví. Tích hợp service catalog + workflow engine (refundCredit)."
status: in_progress
priority: P1
effort: 18.5h
branch: feat/user-wallet-vnd
tags: [wallet, payment, credit, vnd, sepay, service-catalog]
blockedBy: [260809-1030-workflow-engine-refactor]
blocks: []
created: 2026-08-11
---

# User Wallet VND

## Overview

Bổ sung ví VND per-user bên cạnh hệ thống credit hiện tại. **Kiến trúc 3 tầng:** Wallet VND (tiền thật, nạp/rút) → mua credit (đơn vị tiêu dùng dịch vụ) → credit tiêu trong workflow engine (subtractCredit khi supporter làm việc). Khi refund (T13 veto): credit → VND hoàn về ví (refundCredit gọi WalletService). Service catalog (3 bảng: service_types → service_packages → service_pricing) để giá dịch vụ linh hoạt.

**Nguồn:** `docs/research/user-wallet-brainstorm-2026-08-11.md` (brainstorm, quyết định) + `docs/research/wallet-schema-research-2026-08-11.md` (schema research, concurrency pattern).

## Vấn đề hiện tại (5 problems)

| # | Vấn đề | Impact |
|---|---|---|
| P1 | Credit chết trong case bị hủy (reject trước khi dùng) | Credit đã mua không dùng được cho case khác |
| P2 | Refund không trả tiền thật (veto chỉ zero-out credit_ledgers) | Không có luồng hoàn VND về ví |
| P3 | Không chuyển credit giữa case | Case thừa credit không giúp case thiếu |
| P4 | Chỉ 1 loại service (39k/credit) | Không mở rộng được gói mới |
| P5 | Payment phụ thuộc người (proof upload cần admin duyệt) | Chưa tự động hoàn toàn |

## Giải pháp

**Ví VND gắn user + credit vẫn là đơn vị tiêu dùng dịch vụ.** 1 user = 1 ví. Nạp tiền qua SePay → ví +số VND. Mua credit bằng ví. Case trừ credit khi supporter làm việc. Reject/veto → hoàn VND về ví.

**Service catalog 3 bảng** — service_types (phân loại) → service_packages (gói) → service_pricing (lịch sử giá). Thêm service mới = 1 INSERT, không migration.

## Dependencies

```
Workflow Engine Refactor (260809-1030)
  ├─ Phase 01 (schema) ──┐
  ├─ Phase 02 (registry)  ├─ Wallet plan CÓ THỂ bắt đầu song song
  ├─ Phase 03 (executor) ─┘  (phase 01-04, 06, 07 không conflict)
  │
  └─ Phase 03 COMPLETE → Wallet Phase 05 (integration) unblocked
```

**Wallet plan phase 01-04, 06, 07:** độc lập với workflow — có thể bắt đầu ngay.  
**Wallet plan phase 05:** chờ workflow phase 03 (CaseTransitionService) để biết interface executor.  
**Wallet plan phase 05 cũng chờ wallet phase 02 (WalletService) hoàn thành.**

## Files map

```
MỚI  apps/api/src/modules/wallet/                          (module mới)
MỚI  apps/api/src/modules/wallet/domain/wallet.types.ts
MỚI  apps/api/src/modules/wallet/application/wallet.service.ts
MỚI  apps/api/src/modules/wallet/application/wallet-topup.usecase.ts
MỚI  apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts
MỚI  apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts
MỚI  apps/api/src/modules/wallet/application/sepay-topup-webhook.usecase.ts
MỚI  apps/api/src/modules/wallet/application/purchase-credits.usecase.ts

MỚI  apps/api/src/modules/packages/application/service-type.usecase.ts
MỚI  apps/api/src/modules/packages/application/service-pricing.usecase.ts
MỚI  apps/api/src/modules/packages/infrastructure/http/packages.routes.ts (mở rộng)

MỚI  apps/web-1/app/dashboard/wallet/                      (FE wallet page)
MỚI  apps/web-1/app/dashboard/wallet/_components/

SỬA  apps/api/src/modules/cases/application/case-transition.service.ts  (phase 05)
SỬA  apps/api/src/modules/cases/domain/transition-registry.ts           (phase 05)
SỬA  apps/api/src/modules/payments/application/sepay-webhook.usecase.ts (phase 03)
SỬA  apps/web-1/app/dashboard/layout.tsx                                (nav link ví)

KHÔNG ĐỔI  credit-ledger.repository.ts (giữ read-only, không ghi mới sau migration)
GIỮ  credit_ledgers table (read-only cho audit, xóa sau khi tất cả case cũ đóng)
```

## Phases

| Phase | Name | Status | Effort | Depends |
|-------|------|--------|--------|---------|
| 01 | [Schema & Migration](./phase-01-schema-migration.md) | ✅ Done | 2h | — |
| 02 | [WalletService](./phase-02-wallet-service.md) | ✅ Done | 3h | Phase 01 |
| 03 | [Top-up Flow](./phase-03-topup-flow.md) | ✅ Done | 3h | Phase 01, 02 |
| 04 | [Service Catalog](./phase-04-service-catalog.md) | ✅ Done | 2h | Phase 01 |
| 05 | [Workflow Integration](./phase-05-workflow-integration.md) | ✅ Done | 2h | Phase 02 + WF Phase 03 |
| 06 | [Frontend UI](./phase-06-frontend-ui.md) | ✅ Done | 3h | Phase 02, 03, 04 |
| 07 | [Legacy Migration](./phase-07-legacy-migration.md) | 🔲 Pending | 2h | Phase 02, 05 |
| 08 | [Purchase Credit Flow](./phase-05-workflow-integration.md#phase-08-bổ-sung--purchase-credit-flow) | ✅ Done | 1.5h | Phase 02, 04 |

**Thứ tự implement khuyến nghị:**
```
Phase 01 (schema) ──▶ Phase 02 (service) ──▶ Phase 03 (top-up) ──┐
                         │                                         │
                         └─▶ Phase 04 (catalog) ──────────────────┤
                                                                   │
                     (chờ WF Phase 03) ──▶ Phase 05 (integration) ─┤
                                                                   │
                     Phase 08 (purchase credits) ◀─────────────────┘
                     Phase 06 (FE) ◀───────────────────────────────┘
                     Phase 07 (migration) ◀── chạy sau khi test pass
```

## Rủi ro

| Rủi ro | Impact | Mitigation |
|---|---|---|
| Migration credit → ví sai số tiền | Rất cao | Clone production DB test trước. Check từng case audit trail |
| Concurrent trừ tiền 2 case cùng lúc → vượt số dư | Cao | `SELECT FOR UPDATE` lock wallet row. Unit test concurrent |
| SePay webhook trùng → deposit 2 lần | Cao | `wallet_transactions.idempotency_key` UNIQUE (fix G1) |
| Balance cache drift vs ledger | Trung bình | Reconciliation query `SUM(ledger) === cache` định kỳ |
| Song song wallet mới + credit ledger cũ | Thấp | Ví và credit CÙNG tồn tại (kiến trúc 3 tầng). Case mới mua credit qua ví, case cũ credit mua ngoài hệ thống |
| Admin dashboard mất audit trail | Thấp | wallet_transactions view đầy đủ balance_before/after |

## Success Criteria

- [ ] 5 problems (P1-P5) solved: credit không chết, refund thật qua ví, nhiều gói dịch vụ, auto-verify toàn bộ
- [ ] 5 gotchas (G1-G5) fixed: dedup DB-level, no silent skip, topup status clear, UUID idempotency key, price từ DB
- [ ] WalletService: deposit/withdraw/refund/getBalance/getHistory — tất cả trong DB transaction
- [ ] Top-up flow: user tạo topup → nhận QR → chuyển khoản → SePay webhook auto-verify → ví +VND
- [ ] Service catalog: admin CRUD service_types/packages/pricing hoạt động
- [ ] Workflow integration: **hasCredit guard → check credit_ledgers (sync). subtractCredit → credit_ledgers -1. refundCredit → WalletService.refund() hoàn VND về ví**
- [ ] Purchase credit flow: user mua credit từ ví VND → ví -VND, credit_ledgers +1 (cùng transaction)
- [ ] FE: trang ví hiển thị balance + lịch sử giao dịch + nút nạp tiền + nút mua credit
- [ ] Script migrate: credit tồn cũ → VND về ví (tỉ giá 39k/credit). Giữ credit_ledgers read-only
- [ ] check-types root 3/3 PASS, eslint web 0 warning
- [ ] Concurrent test: 2 request trừ tiền cùng lúc → 1 thành công 1 InsufficientBalance

## Quyết định đã chốt (brainstorm §8)

| # | Quyết định |
|---|---|
| 1 | Giá dịch vụ lưu DB (3 tables) |
| 2 | Không pending balance (SePay webhook auto-verify) |
| 3 | Chỉ refund nội bộ VND về ví (không rút ngân hàng) |
| 4 | Không số dư âm |
| 5 | Audit trail = wallet_transactions + API list filter |

## Validation

**Validated:** 2026-08-11 (brainstorm session)  
**Questions chốt:** 5/5  
**Research:** wallet-schema-research-2026-08-11.md (double-entry ledger, SELECT FOR UPDATE, service catalog)

## Red Team Review (2026-08-11)

12 findings — full report: `reports/red-team-findings.md`. Amendments status (updated 2026-08-11):

| # | Sev | Finding | Fix | Applied? |
|---|---|---|---|---|
| A1 | CRIT | Nested Prisma tx | WalletService.refund() accept optional `tx` param | ✓ phase-02, phase-05 |
| A2 | CRIT | Migration flat 39000 ratio | SUM actual `payment.amount` per case, fallback locked_price | ✓ phase-07 |
| A3 | HIGH | Lazy-create wallet race | Tạo wallet row trong auth hook + backfill phase-01 (Ghi chú: current implementation still lazy-create — acceptable for MVP with idempotency key guard) | ⚠ Partial |
| A4 | HIGH | SePay webhook no amount validation | So sánh sepayAmount với topup.amount → flag manual review | ⚠ Pending |
| A5 | HIGH | withdraw() idempotencyKey optional | Required (non-optional), caller generates deterministic key | ✓ phase-02 |
| A6 | MED | Feature flag `createdAt >= date` fragile | Dùng credit_ledgers cho mọi case. Wallet là tầng mua credit. Không cần Case.use_wallet flag | ✓ (removed — 3-tier model) |
