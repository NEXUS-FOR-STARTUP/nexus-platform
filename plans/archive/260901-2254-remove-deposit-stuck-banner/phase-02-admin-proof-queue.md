---
title: "Phase 2 — Admin proof queue + verify guard"
status: completed
plan: 260901-2254-remove-deposit-stuck-banner
---

# Phase 2 — Admin proof queue + verify guard

## Context Links

- [Plan overview](./plan.md)
- `apps/web-1/app/admin/page.tsx` (~234–241)
- `apps/api/src/modules/deposits/application/verify-deposit.usecase.ts`
- `apps/api/src/modules/deposits/domain/deposit.types.ts`

## Overview

- Priority: P1
- Effort: 1h
- Queue = pending có ảnh. BE cấm duyệt không ảnh. Không status mới. **Không** sửa bảng admin.

## Nghiệp vụ

Mở QR ≠ cần admin. Tab “Duyệt minh chứng” chỉ việc có ảnh.

Hai lớp đủ: FE ẩn row không ảnh; BE từ chối `verified` không ảnh. Sửa thêm menu Duyệt trên table = thừa (sau filter không còn row không ảnh).

## Requirements

- `pendingPaymentsCount` + `filteredDeposits` (pending tab): `status === "pending" && Boolean(proof_file_url?.trim())`.
- `verifyDepositUseCase` `verified` mà không ảnh và không `amount_mismatch` → 400 `PROOF_REQUIRED`.
- `rejected` không đòi ảnh.
- Không đụng `AdminDepositVerificationTable.tsx`.
- Không Prisma. Không đổi admin list API.

## Architecture

```
pending + URL null  → ẩn queue; verified → 400
pending + URL       → hiện queue; verified OK
amount_mismatch     → history; verified không ảnh OK
```

Một helper:

```ts
export function canAdminCreditDeposit(d: {
  status: string;
  proof_file_url: string | null;
}): boolean {
  if (d.proof_file_url?.trim()) return true;
  return d.status === "amount_mismatch";
}
```

## Files

Modify: `admin/page.tsx`, `deposit.types.ts`, `verify-deposit.usecase.ts`

Create: `apps/api/src/shared/infrastructure/tests/verify-deposit-proof-guard.test.ts` (test helper thuần)

Do not touch: table component, schema, SePay, wallet.

## Steps

1. Helper + test.
2. Guard use case. Message: `"Chưa có ảnh minh chứng, không thể duyệt nạp tiền."`
3. Filter + badge `page.tsx`.
4. Visual: QR mới không vào tab; có ảnh thì còn Duyệt.

## Todo

- [x] Helper + test
- [x] Guard use case
- [x] Filter + badge
- [x] Visual

## Success

Mở QR → badge không +1. Verify không ảnh → 400. SePay không đổi. Không migrate.

## Next

Phase 3 bảng học viên ≠ queue này.
