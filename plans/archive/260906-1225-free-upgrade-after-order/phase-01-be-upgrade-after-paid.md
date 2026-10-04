# Phase 01 — BE giá audit + upgrade sau trừ ví

## Context Links

- [Plan](./plan.md)
- `apps/api/src/modules/orders/application/create-order.usecase.ts`
- `apps/api/src/modules/cases/application/upgrade-package.usecase.ts` — `ALLOWED_UPGRADE_TARGET = "pkg_tf_audit"`
- `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` — `upgradeCasePackage` (~804) set `payment_status: "unpaid"`; **không gọi** từ order

## Overview

- Priority: P1
- Status: Completed
- Không đảo FE `POST /orders` trước: case FREE giá 0 → `INVALID_PRICE`.

## Key Insights

`resolveCreditAuditPrice` đọc `case.package_id`. FREE `price <= 0` throw. FE mới upgrade trước. `upgradeCasePackage` persist + `unpaid` **ngoài** tx order. `withdraw` nested tx throw `INSUFFICIENT_BALANCE` **trước** `tx.case.update` → nhét upgrade **sau** withdraw là đủ.

## Requirements

1. Case FREE/`locked_price === 0`: giá credit_audit = giá `"pkg_tf_audit"` (cùng `pricing_tiers` is_current).
2. Thiếu ví: không đổi `package_id`, `locked_price`, `payment_status`.
3. Đủ ví: sau withdraw, FREE → `package_id: "pkg_tf_audit"`, `locked_price: unitPrice`, `payment_status: "paid"`, event `package_upgraded`.
4. Không gọi `upgradeCasePackage`. Literal `"pkg_tf_audit"` copy từ `ALLOWED_UPGRADE_TARGET`, không import usecase cases.

## Architecture

```
POST /orders credit_audit
  resolveCreditAuditPrice
    package giá > 0 → dùng
    giá <= 0 → load pkg_tf_audit
  tx:
    order.create → withdraw
      fail INSUFFICIENT → rollback, case nguyên
      ok → creditLedger → case.update paid ± upgrade FREE → T19 nếu done
```

## Related Code Files

Tạo (nếu `create-order.usecase.ts` + helper > 200 dòng):

- `apps/api/src/modules/orders/application/credit-audit-order.helpers.ts`

Sửa:

- `apps/api/src/modules/orders/application/create-order.usecase.ts`

Không sửa: `upgrade-package.usecase.ts`, webhook, Prisma.

## Implementation Steps

1. **`resolveCreditAuditPrice`** — giữ lookup case `package_id`. `price = pkg.pricing_tiers[0]?.price ?? pkg.price`. Nếu `price > 0` return. Else load `"pkg_tf_audit"` cùng include tiers. Audit missing → `PACKAGE_NOT_FOUND`. Audit giá `<= 0` → `INVALID_PRICE`. Case không `package_id` → `INVALID_PACKAGE` như cũ.

2. **`applyPaidCreditCaseUpdate(tx, { caseId, userId, unitPrice, caseRecord })`** — `caseRecord` có `package_id`, `locked_price`, `owner_auth_user_id`, `internal_status`. FREE = `package_id === "pkg_tf_free"` **hoặc** `locked_price === 0`. Một `tx.case.update`: luôn `payment_status: "paid"`; nếu FREE thêm `package_id: "pkg_tf_audit"`, `locked_price: unitPrice`. Nếu vừa upgrade: `tx.caseEvent.create` `{ event_type: "package_upgraded", actor: userId, metadata_json: { from: fromPackageId, to: "pkg_tf_audit", locked_price: unitPrice } }` — không dùng `createCaseEvent` (không nhận `tx`).

3. **Gắn vào tx** — `findUnique` thêm `package_id`, `locked_price`. Thay `tx.case.update` paid-only bằng helper. Thứ tự: withdraw → creditLedger → helper → T19 nếu `done`.

4. File usecase đang ~226 dòng: tách `resolveCreditAuditPrice` + helper sang `credit-audit-order.helpers.ts`. Usecase import gọi.

## Todo List

- [x] `resolveCreditAuditPrice` fallback `pkg_tf_audit`
- [x] Helper upgrade sau withdraw, không gọi `upgradeCasePackage`
- [x] Tách file nếu > 200 dòng

## Success Criteria

- Ví 0 + case FREE: `POST /orders` 400 `INSUFFICIENT_BALANCE`, DB `package_id` vẫn `pkg_tf_free`.
- Ví đủ + case FREE: 200, `pkg_tf_audit`, `paid`, `locked_price` = giá audit, event `package_upgraded`.
- Case đã audit: hành vi order cũ (không event upgrade).

## Risk Assessment

`locked_price === 0` trên gói lạ → upgrade audit. Khớp `isCaseFree` FE. Seed thiếu `pkg_tf_audit` → `PACKAGE_NOT_FOUND` (cùng upgrade-package).

## Security Considerations

Owner check `caseRecord.owner_auth_user_id !== userId` giữ trước update. Không nới auth.

## Next Steps

Phase 02.
