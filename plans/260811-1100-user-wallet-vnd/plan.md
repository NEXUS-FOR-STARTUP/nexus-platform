---
title: "User Wallet VND — Ví người dùng"
description: "Thay credit per-case bằng ví VND per-user. Nạp tiền qua SePay, dùng trực tiếp. Tích hợp service catalog + workflow engine."
status: pending
priority: P1
effort: 17h
branch: feat/user-wallet-vnd
tags: [wallet, payment, credit, vnd, sepay, service-catalog]
blockedBy: [260809-1030-workflow-engine-refactor]
blocks: []
created: 2026-08-11
---

# User Wallet VND

## Overview

Thay hệ thống credit per-case (per-case, credit đơn vị trừu tượng) bằng ví VND per-user (1đ = 1đ, tiền thật, không quy đổi). Gắn service catalog (3 bảng: service_types → service_packages → service_pricing) để giá dịch vụ linh hoạt. Tích hợp với workflow engine (Amendment #3 — guard hasCredit / action subtractCredit / refundCredit gọi WalletService).

**Nguồn:** `docs/research/user-wallet-brainstorm-2026-08-11.md` (brainstorm, quyết định) + `docs/research/wallet-schema-research-2026-08-11.md` (schema research, concurrency pattern).

## Vấn đề hiện tại (5 problems)

| # | Vấn đề | Impact |
|---|---|---|
| P1 | Credit chết trong case bị hủy (reject trước khi dùng) | User mất tiền, không dùng cho case khác |
| P2 | Refund không trả tiền thật (veto chỉ reset số về 0) | Không có luồng qua cổng thanh toán |
| P3 | Không chuyển credit giữa case | Case thừa không giúp case thiếu |
| P4 | Chỉ 1 loại service (39k/credit) | Không mở rộng được gói mới |
| P5 | Payment phụ thuộc người (proof upload cần admin duyệt) | Chưa tự động hoàn toàn |

## Giải pháp

**Ví VND gắn user** — 1 user = 1 ví. Nạp tiền qua SePay → ví +số VND. Case trừ từ ví. Reject/veto → hoàn về ví.

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
| 01 | [Schema & Migration](./phase-01-schema-migration.md) | 🔲 Pending | 2h | — |
| 02 | [WalletService](./phase-02-wallet-service.md) | 🔲 Pending | 3h | Phase 01 |
| 03 | [Top-up Flow](./phase-03-topup-flow.md) | 🔲 Pending | 3h | Phase 01, 02 |
| 04 | [Service Catalog](./phase-04-service-catalog.md) | 🔲 Pending | 2h | Phase 01 |
| 05 | [Workflow Integration](./phase-05-workflow-integration.md) | 🔲 Pending | 2h | Phase 02 + WF Phase 03 |
| 06 | [Frontend UI](./phase-06-frontend-ui.md) | 🔲 Pending | 3h | Phase 02, 03, 04 |
| 07 | [Legacy Migration](./phase-07-legacy-migration.md) | 🔲 Pending | 2h | Phase 02, 05 |

**Thứ tự implement khuyến nghị:**
```
Phase 01 (schema) ──▶ Phase 02 (service) ──▶ Phase 03 (top-up) ──┐
                        │                                         │
                        └─▶ Phase 04 (catalog) ──────────────────┤
                                                                  │
                    (chờ WF Phase 03) ──▶ Phase 05 (integration) ─┤
                                                                  │
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
| Song song wallet mới + credit ledger cũ → split-brain credit | Trung bình | Feature flag `USE_WALLET` per case. Case mới → ví, case cũ → ledger |
| Admin dashboard mất audit trail | Thấp | wallet_transactions view đầy đủ balance_before/after |

## Success Criteria

- [ ] 5 problems (P1-P5) solved: credit không chết, refund thật qua ví, chuyển credit giữa case = không cần (ví chung), nhiều gói dịch vụ, auto-verify toàn bộ
- [ ] 5 gotchas (G1-G5) fixed: dedup DB-level, no silent skip, topup status clear, UUID idempotency key, price từ DB
- [ ] WalletService: deposit/withdraw/refund/getBalance/getHistory — tất cả trong DB transaction
- [ ] Top-up flow: user tạo topup → nhận QR → chuyển khoản → SePay webhook auto-verify → ví +VND
- [ ] Service catalog: admin CRUD service_types/packages/pricing hoạt động
- [ ] Workflow integration: hasCredit guard gọi WalletService.getBalance, subtractCredit/refundCredit gọi WalletService.withdraw/refund
- [ ] FE: trang ví hiển thị balance + lịch sử giao dịch + nút nạp tiền
- [ ] Script migrate: credit_ledgers → wallet_transactions chạy đúng trên clone DB
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

12 findings — full report: `reports/red-team-findings.md`. Critical amendments applied to phase files:

| # | Sev | Finding | Fix |
|---|---|---|---|
| A1 | CRIT | Nested Prisma tx: WalletService + CaseTransitionService dùng tx riêng | WalletService methods accept optional `tx` param |
| A2 | CRIT | Migration dùng `balance * 39000` flat ratio — sai nếu từng có giá khác | Sum actual `payment.amount` per case |
| A3 | HIGH | Lazy-create wallet race (findUnique then create) | Tạo wallet row trong auth hook + backfill phase-01 |
| A4 | HIGH | SePay webhook không validate amount mismatch | So sánh sepayAmount với topup.amount → flag manual review |
| A5 | HIGH | withdraw() idempotencyKey optional + randomUUID | Bắt buộc idempotencyKey, caller generate deterministic key |
| A6 | MED | Feature flag `createdAt >= date` fragile | Thêm `Case.use_wallet BOOLEAN DEFAULT false` |
