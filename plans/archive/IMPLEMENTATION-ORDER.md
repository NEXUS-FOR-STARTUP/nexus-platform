# Implementation Order — Workflow + Wallet Plans

**Updated:** 2026-08-11
**Plans:** `260809-1030-workflow-engine-refactor` (WF) + `260811-1100-user-wallet-vnd` (W)
**Architecture:** 3-tier — Wallet VND → mua credit → credit tiêu trong workflow

---

## Tổng quan

2 plan, 14 phases, 37.5h. Workflow plan (WF) build trước vì nó cung cấp CaseTransitionService — cổng duy nhất cho mọi transition. Wallet plan (W) dùng cổng đó để tích hợp refundCredit + purchase credit.

**Critical path:** WF-01 → WF-02 → WF-03 → W-05 → W-08 → WF-04 → WF-05 → WF-06. Các phase còn lại chạy song song.

---

## Phase Dependency Graph

```
WF-01 ──▶ WF-02 ──▶ WF-03 ◀══ SEAM TÍCH HỢP ══
 (1h)      (2h)      (4h)         │
                       │          │
         ┌─────────────┘          │
         │                        │
    W-01 (2h) ──▶ W-02 (3h) ─────┤
                   │              │
    W-04 (2h) ────┘              │
         │                        │
         └──── W-08 (1.5h) ◀─────┘
                      │
                      ▼
              ┌─ WF-04 (4h) ──▶ WF-05 (4h) ──▶ WF-06 (4h)
              │
    W-03 (3h) ┤  (song song)
    W-06 (3h) ┤  (song song)
    W-07 (2h) ┘  (cuối cùng)
```

---

## Thứ tự implement

### Giai đoạn 1: Nền móng (WF + W song song)

| # | Phase | Plan | File | Effort | Depends | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | WF-01 | Workflow | `phase-01-schema-xstate-setup.md` | 1h | — | Migration + xstate install + types |
| 2 | WF-02 | Workflow | `phase-02-transition-registry.md` | 2h | WF-01 | Machine definition (single source of truth) |
| 3 | WF-03 | Workflow | `phase-03-case-transition-service.md` | 4h | WF-02 | **Cổng chính.** refundCredit = stub NOT_IMPLEMENTED |
| ⇄ | W-01 | Wallet | `phase-01-schema-migration.md` | 2h | — | Wallet + catalog schema. Song song WF-01..03 |
| ⇄ | W-02 | Wallet | `phase-02-wallet-service.md` | 3h | W-01 | WalletService. Song song WF-02..03 |
| ⇄ | W-04 | Wallet | `phase-04-service-catalog.md` | 2h | W-01 | Service catalog CRUD. Song song |

### Giai đoạn 2: Tích hợp (WF + W gặp nhau)

| # | Phase | Plan | File | Effort | Depends | Ghi chú |
|---|---|---|---|---|---|---|
| 4 | W-05 | Wallet | `phase-05-workflow-integration.md` | 2h | WF-03 + W-02 | Wire refundCredit → WalletService.refund(tx) |
| 5 | W-08 | Wallet | `phase-05-workflow-integration.md#phase-08` | 1.5h | W-02 + W-04 | Purchase credit flow (ví → credit_ledgers) |

### Giai đoạn 3: Lan use case + Tests

| # | Phase | Plan | File | Effort | Depends | Ghi chú |
|---|---|---|---|---|---|---|
| 6 | WF-04 | Workflow | `phase-04-spread-use-cases.md` | 4h | WF-03 | 9 use case qua cổng + FE allowed_transitions |
| 7 | WF-05 | Workflow | `phase-05-tests.md` | 4h | WF-04 | Machine + executor + integration tests |
| 8 | WF-06 | Workflow | `phase-06-refund-resubmit-policy.md` | 4h | WF-04 | T12-T15 + T3/T4 + cleanup symflow |

### Giai đoạn 4: Wallet hoàn thiện (song song)

| # | Phase | Plan | File | Effort | Depends | Ghi chú |
|---|---|---|---|---|---|---|
| 9 | W-03 | Wallet | `phase-03-topup-flow.md` | 3h | W-02 | Top-up SePay. Song song WF-04..06 |
| 10 | W-06 | Wallet | `phase-06-frontend-ui.md` | 3h | W-05 | FE ví + purchase UI. Song song WF-04..06 |
| 11 | W-07 | Wallet | `phase-07-legacy-migration.md` | 2h | W-05 | Migrate credit cũ → VND. Clone DB trước |

---

## Mốc quan trọng

| Mốc | Sau phase | Trạng thái hệ thống |
|---|---|---|
| **M1: Cổng hoạt động** | WF-03 | ✅ Done (`0f08572`) |
| **M2: Tích hợp ví** | W-05 + W-08 | ✅ Done (`0f08572`) |
| **M3: Hoàn thiện engine** | WF-06 | ✅ Done — 16 transition hoạt động, symflow stripped, 41 machine tests pass |
| **M4: Hoàn thiện ví** | W-07 | ✅ Done — W-06 FE + W-07 migration (7 case, 741k VND) |

---

## Lưu ý khi implement

1. **WF-03 refundCredit stub:** Viết `throw NOT_IMPLEMENTED` ban đầu. W-05 swap sang WalletService.refund(). WF-03 test được độc lập.

2. **Không nested Prisma tx:** WalletService.refund() nhận optional `tx` param. Khi gọi từ CaseTransitionService → pass tx vào → dùng chung 1 transaction.

3. **Machine is single source of truth:** Mọi guard/action/transition khai báo trong `case-machine.ts`. Không viết bảng tay. Dùng `transition()` + `resolveState()` native.

4. **Column names:** `Case.locked_price` (Int?), `CaseEvent.event_type` (String), `CreditLedger.case_id` (join qua `case.owner_auth_user_id` để lấy credit balance per user).

5. **DB safety:** Migration chỉ `--create-only`. Đọc SQL trước khi apply. Tuân `prisma-migration-safety.md`.

6. **Chạy test thường xuyên:** Sau mỗi phase → `npm test` + `npm run check-types`.

---

## Estimated effort

| Khu vực | Phase | Effort |
|---|---|---|
| Workflow | WF-01..06 | 19h |
| Wallet | W-01..08 | 18.5h |
| **Total** | **14 phases** | **37.5h** |
