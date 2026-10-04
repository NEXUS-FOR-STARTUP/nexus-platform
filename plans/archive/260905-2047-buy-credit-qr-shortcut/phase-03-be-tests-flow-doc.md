# Phase 03 — BE invariant tests + flow doc

## Context Links

- [Phase 01](./phase-01-nghiep-vu-blast-radius.md)
- `apps/api/src/shared/infrastructure/tests/verify-deposit-proof-guard.test.ts`
- `apps/api/src/modules/deposits/application/verify-deposit.usecase.ts`
- `apps/api/src/modules/payments/application/sepay-webhook.usecase.ts`
- `docs/flows/payment-verification-flow.md`

## Overview

- Priority: P1
- Status: Completed
- **Không** đổi production BE. Test + đoạn flow học viên.

## Key Insights

`verifyDepositUseCase` / `sepayWebhookUseCase` chỉ `walletService.deposit`. Không import orders/credit. Test khóa điều đó để PR sau không “tiện” auto +credit lúc admin duyệt.

## Requirements

- Cấm sửa body: `verify-deposit.usecase.ts`, `sepay-webhook.usecase.ts`, `create-deposit.usecase.ts`, `create-order.usecase.ts`, Prisma.
- Test `node:test` trong `apps/api/src/shared/infrastructure/tests/`.
- Không DB thật nếu mock/source-assert đủ. Không `prisma migrate`.

## Architecture

Hai lớp test:

1. **Source invariant (không cần DB):** đọc file usecase dưới dạng text hoặc import graph — `verify-deposit.usecase.ts` và `sepay-webhook.usecase.ts` không chứa `createOrderUseCase`, `creditLedger`, `payment_status`. Đơn giản nhất: `node:fs` đọc source, `assert.equal(src.includes("createOrderUseCase"), false)` và không `creditLedger`. Dễ giòn nếu rename — chấp nhận, đúng mục đích chặn nhét fulfill.

2. **Không** viết e2e SePay. FE không có test runner trong web-1.

## Related Code Files

Tạo: `apps/api/src/shared/infrastructure/tests/deposit-does-not-grant-credit.test.ts`

Sửa: `docs/flows/payment-verification-flow.md` — thêm mục “Click học viên (2026-09-05)” sau Nguyên tắc. Không xóa 5 nguyên tắc cũ.

## Implementation Steps

1. Test file:

```ts
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../modules");

test("deposit verification never buys case credit", () => {
  const verify = readFileSync(join(root, "deposits/application/verify-deposit.usecase.ts"), "utf8");
  const sepay = readFileSync(join(root, "payments/application/sepay-webhook.usecase.ts"), "utf8");
  for (const src of [verify, sepay]) {
    assert.equal(src.includes("createOrderUseCase"), false);
    assert.equal(src.includes("creditLedger"), false);
    assert.equal(src.includes("CREDIT_AUDIT"), false);
  }
  assert.equal(verify.includes("walletService.deposit"), true);
  assert.equal(sepay.includes("walletService.deposit"), true);
});
```

Chạy: `cd apps/api && npx tsx --test src/shared/infrastructure/tests/deposit-does-not-grant-credit.test.ts` (cùng runner `npm test` workspace).

2. Doc — chèn sau nguyên tắc 5:

```
## Click học viên (rút ngắn 2026-09)

- Đủ ví: Mua credit trên hồ sơ → trừ ví + cộng lượt. Không QR.
- Thiếu ví từ hồ sơ: mở QR nạp ổ thiếu. Không bắt qua trang ví.
- Còn trang QR: SePay hoặc admin verified → hệ thống mua lượt cho hồ sơ vừa chọn.
- Rời QR / vào Ví của tôi: chỉ cộng VND. Học viên bấm Mua credit lại khi đủ ví.
- Nạp từ trang ví: không gắn hồ sơ, không tự mua lượt.
```

Giữ nguyên tắc 3: nạp ví không làm case đã thanh toán.

3. Không changelog/roadmap trong phase — cook finalize lo.

## Todo List

- [x] `deposit-does-not-grant-credit.test.ts` xanh
- [x] Đoạn click trong `payment-verification-flow.md`

## Success Criteria

- `npm test` (hoặc file test trên) pass.
- Grep `createOrderUseCase` trong 2 usecase deposit/sepay = 0.
- Manual (dev, ví ~0, case trả phí): đủ 4 case phase 01 luật 1–6. Không migrate.

Manual matrix:

| # | Input | Output |
|---|--------|--------|
| 1 | Ví ≥ giá, mua 1 | Order paid, credit +1, không QR |
| 2 | Ví 0, mua từ hồ sơ, treo QR, SePay khớp | ≤5s về case, credit ≥1, ví ~0 |
| 3 | Ví 0, mua từ hồ sơ, vào Ví của tôi, rồi verified | Ví tăng, credit case không tăng |
| 4 | Ví → Tạo mã → QR verified | Ví tăng, không order |

## Risk Assessment

Source-string test giòn khi refactor tên. Đúng mục đích: fail PR nếu ai import order vào verify.

## Security Considerations

Không endpoint mới. Không nới auth.

## Next Steps

Cook plan. Không BE fulfill.
