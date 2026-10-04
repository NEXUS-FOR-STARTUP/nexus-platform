# Phase 02: Deposit Module (New)

**Status:** complete | **Effort:** 3h | **Depends:** Phase 01 | **Blocked by:** —

## Overview

New `deposits` module replaces `Payment` + `WalletTopup` for nạp tiền use case. User creates deposit → gets bank info + QR → transfers money → Sepay webhook auto-verifies (or admin manually verifies) → wallet balance increases.

Old `WalletTopup` (POST /wallet/topups) + `Payment` (POST /payments for case-bound purchase) remain active for backward compat. New deposits is for wallet top-ups only.

## Task Breakdown

### T02.1: Domain types

**File:** `apps/api/src/modules/deposits/domain/deposit.types.ts` (NEW)

```typescript
export interface CreateDepositRequest {
  amount: number; // VND
  metadataJson?: Record<string, unknown>;
}

export interface VerifyDepositRequest {
  status: "verified" | "rejected";
  rejectionReason?: string;
}

export type DepositStatus = "pending" | "verified" | "rejected";

export const FINAL_DEPOSIT_STATUSES: DepositStatus[] = ["verified", "rejected"];

export function isFinalDepositStatus(s: string): boolean {
  return FINAL_DEPOSIT_STATUSES.includes(s as DepositStatus);
}
```

### T02.2: DTOs

**File:** `apps/api/src/modules/deposits/application/deposits.dto.ts` (NEW)

```typescript
import type { BankInfo } from "../../payments/application/payments.dto.js";

// Reuse BankInfo from payments module (same bank account info)
export type { BankInfo } from "../../payments/application/payments.dto.js";

export interface CreateDepositResponse {
  depositId: string;
  amount: number;
  transferContent: string;
  bankInfo: BankInfo;
}

export interface GetDepositResponse {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  transfer_content: string;
  status: string;
  proof_file_url: string | null;
  rejection_reason: string | null;
  bank_transaction_id: string | null;
  bank_credited_at: string | null;
  verified_by: string | null;
  verification_source: string | null;
  created_at: string;
  bankInfo: BankInfo;
}

export interface DepositHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  transfer_content: string;
  verified_at: string | null;
  bank_transaction_id: string | null;
  created_at: string;
}

export interface ListDepositsResponse {
  deposits: DepositHistoryItem[];
}
```

### T02.3: Repository

**File:** `apps/api/src/modules/deposits/infrastructure/persistence/deposit.repository.ts` (NEW)

```typescript
import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";

export async function createDeposit(params: {
  userId: string;
  amount: number;
  transferContent: string;
  idempotencyKey: string;
  metadataJson?: Record<string, unknown>;
}) {
  return prisma.deposit.create({
    data: {
      user_id: params.userId,
      amount: params.amount,
      transfer_content: params.transferContent,
      idempotency_key: params.idempotencyKey,
      status: "pending",
      metadata_json: params.metadataJson as any,
    },
  });
}

export async function findDepositById(id: string) {
  return prisma.deposit.findUnique({ where: { id } });
}

export async function findDepositByTransferContent(content: string) {
  return prisma.deposit.findFirst({
    where: { transfer_content: content, status: { notIn: ["verified", "rejected"] } },
  });
}

export async function findPendingDepositsByUser(userId: string) {
  return prisma.deposit.findMany({
    where: { user_id: userId, status: "pending" },
    orderBy: { created_at: "desc" },
  });
}

export async function updateDepositStatus(
  id: string,
  data: {
    status: "verified" | "rejected";
    rejectionReason?: string | null;
    adminId?: string;
    verificationSource: "manual" | "auto";
    bankTransactionId?: string;
    bankCreditedAt?: Date;
  },
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.deposit.update({
    where: { id },
    data: {
      status: data.status,
      rejection_reason: data.rejectionReason ?? null,
      verified_by: data.adminId ?? null,
      verification_source: data.verificationSource,
      bank_transaction_id: data.bankTransactionId ?? undefined,
      bank_credited_at: data.bankCreditedAt ?? undefined,
    },
  });
}

export async function findDepositsByUser(userId: string, limit = 20, offset = 0) {
  return prisma.deposit.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function countDepositsByUser(userId: string): Promise<number> {
  return prisma.deposit.count({ where: { user_id: userId } });
}
```

### T02.4: Use case — Create Deposit

**File:** `apps/api/src/modules/deposits/application/create-deposit.usecase.ts` (NEW)

```typescript
import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { createDeposit } from "../infrastructure/persistence/deposit.repository.js";
import { getDepositBankInfo } from "../../payments/domain/bank-info.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateDepositResponse } from "./deposits.dto.js";

const DEPOSIT_PREFIX = "CRTOPUP"; // For SePay matching: CRTOPUP prefix = deposit type

function generateTransferContent(): string {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 hex chars
  return `${DEPOSIT_PREFIX}${suffix}`;
}

export async function createDepositUseCase(
  userId: string,
  amount: number,
): Promise<CreateDepositResponse> {
  if (amount < 10000) {
    throw new AppError(400, "INVALID_AMOUNT", "Số tiền tối thiểu là 10,000 VND");
  }

  const transferContent = generateTransferContent();
  const idempotencyKey = `deposit-create-${transferContent}`;
  const deposit = await createDeposit({
    userId,
    amount,
    transferContent,
    idempotencyKey,
    metadataJson: { prefix: DEPOSIT_PREFIX },
  });

  const bankInfo = getDepositBankInfo(transferContent, amount);

  logger.info({ depositId: deposit.id, userId, amount }, "deposit created");

  return {
    depositId: deposit.id,
    amount,
    transferContent,
    bankInfo,
  };
}
```

**Note:** `getDepositBankInfo` is new in `bank-info.ts` — uses `SEPAY_*` env vars (same bank account as old wallet topup). Original `getBankInfo` (BANK_* env vars) stays for legacy payment module backward compat.

### T02.5: Use case — Verify Deposit

**File:** `apps/api/src/modules/deposits/application/verify-deposit.usecase.ts` (NEW)

```typescript
import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import {
  findDepositById,
  updateDepositStatus,
} from "../infrastructure/persistence/deposit.repository.js";
import { isFinalDepositStatus } from "../domain/deposit.types.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { insertOutboxEvent } from "../../shared/infrastructure/persistence/outbox.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

const SYSTEM_USER_ID = "system";

export async function verifyDepositUseCase(
  adminId: string,
  depositId: string,
  status: "verified" | "rejected",
  rejectionReason?: string,
) {
  const deposit = await findDepositById(depositId);
  if (!deposit) {
    throw new AppError(404, "DEPOSIT_NOT_FOUND", "Không tìm thấy thông tin nạp tiền");
  }

  if (isFinalDepositStatus(deposit.status)) {
    throw new AppError(409, "FINAL_STATUS", "Giao dịch đã ở trạng thái cuối");
  }

  if (status === "rejected" && (!rejectionReason || rejectionReason.length < 10)) {
    throw new AppError(400, "VALIDATION_ERROR", "Lý do từ chối tối thiểu 10 ký tự");
  }

  const verificationSource = adminId === SYSTEM_USER_ID ? "auto" : "manual";
  const eventType = status === "verified" ? DOMAIN_EVENTS.DEPOSIT_VERIFIED : DOMAIN_EVENTS.DEPOSIT_REJECTED;

  // CRITICAL FIX (C1): Single transaction — wallet credit + deposit update + outbox
  await prisma.$transaction(async (tx) => {
    if (status === "verified") {
      const idempotencyKey = `deposit-verify-${depositId}`;
      await walletService.deposit(
        deposit.user_id,
        deposit.amount,
        "deposit",
        depositId,
        idempotencyKey,
        tx,
      );
    }

    await updateDepositStatus(depositId, {
      status,
      rejectionReason: rejectionReason ?? null,
      adminId: adminId === SYSTEM_USER_ID ? undefined : adminId,
      verificationSource,
    }, tx);

    // Outbox event (same tx — no event loss if crash)
    await insertOutboxEvent(tx, {
      event_type: eventType,
      payload_json: { depositId, userId: deposit.user_id, amount: deposit.amount, status },
    });
  });

  logger.info({ depositId, userId: deposit.user_id, status, verifier: adminId }, "deposit verified");

  return { success: true, status };
}
```

### T02.6: Use case — List Deposits

**File:** `apps/api/src/modules/deposits/application/list-deposits.usecase.ts` (NEW)

```typescript
import { findDepositsByUser, countDepositsByUser } from "../infrastructure/persistence/deposit.repository.js";
import type { ListDepositsResponse, DepositHistoryItem } from "./deposits.dto.js";

export async function listDepositsUseCase(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<ListDepositsResponse> {
  const [deposits, total] = await Promise.all([
    findDepositsByUser(userId, limit, offset),
    countDepositsByUser(userId),
  ]);

  const items: DepositHistoryItem[] = deposits.map((d) => ({
    id: d.id,
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    transfer_content: d.transfer_content,
    verified_at: d.status === "verified" ? d.updated_at.toISOString() : null,
    bank_transaction_id: d.bank_transaction_id ?? null,
    created_at: d.created_at.toISOString(),
  }));

  return { deposits: items };
}
```

### T02.7: Use case — Get Deposit

**File:** `apps/api/src/modules/deposits/application/get-deposit.usecase.ts` (NEW)

```typescript
import { AppError } from "../../../shared/domain/app-error.js";
import { findDepositById } from "../infrastructure/persistence/deposit.repository.js";
import { getDepositBankInfo } from "../../payments/domain/bank-info.js";
import type { GetDepositResponse } from "./deposits.dto.js";

export async function getDepositUseCase(
  userId: string,
  depositId: string,
): Promise<GetDepositResponse> {
  const deposit = await findDepositById(depositId);
  if (!deposit) {
    throw new AppError(404, "DEPOSIT_NOT_FOUND", "Không tìm thấy thông tin nạp tiền");
  }

  if (deposit.user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không có quyền xem giao dịch này");
  }

  const bankInfo = getDepositBankInfo(deposit.transfer_content, deposit.amount);

  return {
    id: deposit.id,
    user_id: deposit.user_id,
    amount: deposit.amount,
    currency: deposit.currency,
    transfer_content: deposit.transfer_content,
    status: deposit.status,
    proof_file_url: deposit.proof_file_url,
    rejection_reason: deposit.rejection_reason,
    bank_transaction_id: deposit.bank_transaction_id,
    bank_credited_at: deposit.bank_credited_at?.toISOString() ?? null,
    verified_by: deposit.verified_by,
    verification_source: deposit.verification_source,
    created_at: deposit.created_at.toISOString(),
    bankInfo,
  };
}
```

### T02.8: HTTP Routes + Controller

**File:** `apps/api/src/modules/deposits/infrastructure/http/deposit.controller.ts` (NEW)

```typescript
import type { Context } from "hono";
import { getSession } from "../../../../shared/infrastructure/http-helpers.js";
import { handleError } from "../../../../shared/infrastructure/http-helpers.js";
import { createDepositUseCase } from "../../application/create-deposit.usecase.js";
import { verifyDepositUseCase } from "../../application/verify-deposit.usecase.js";
import { listDepositsUseCase } from "../../application/list-deposits.usecase.js";
import { getDepositUseCase } from "../../application/get-deposit.usecase.js";

export async function createDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { amount } = await c.req.json<{ amount: number }>();
    const result = await createDepositUseCase(session.user.id, amount);
    return c.json(result, 201);
  } catch (err) { return handleError(c, err); }
}

export async function listDepositsHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { limit = "20", offset = "0" } = c.req.query();
    const result = await listDepositsUseCase(session.user.id, Number(limit), Number(offset));
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function getDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { id } = c.req.param();
    const result = await getDepositUseCase(session.user.id, id);
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function verifyDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { id } = c.req.param();
    const { status, rejectionReason } = await c.req.json<{
      status: "verified" | "rejected";
      rejectionReason?: string;
    }>();
    const result = await verifyDepositUseCase(session.user.id, id, status, rejectionReason);
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}
```

**File:** `apps/api/src/modules/deposits/infrastructure/http/deposit.routes.ts` (NEW)

```typescript
import { Hono } from "hono";
import {
  createDepositHandler,
  listDepositsHandler,
  getDepositHandler,
  verifyDepositHandler,
} from "./deposit.controller.js";

export const depositRouter = new Hono();

depositRouter.get("/", listDepositsHandler);
depositRouter.post("/", createDepositHandler);
depositRouter.get("/:id", getDepositHandler);
// Admin-only verify (auth check in controller or middleware)
depositRouter.post("/:id/verify", verifyDepositHandler);
```

### T02.9: Mount Route in index.ts

**File:** `apps/api/src/index.ts`

```typescript
// ADD (after payments routes):
import { depositRouter } from "./modules/deposits/infrastructure/http/deposit.routes.js";
app.route("/api/deposits", depositRouter);
```

### T02.10: Verify admin auth on verify endpoint

**File:** `apps/api/src/modules/deposits/infrastructure/http/deposit.controller.ts`

Add admin role check to `verifyDepositHandler`:
```typescript
export async function verifyDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    // Admin-only gate
    if (session.user.role !== "admin") {
      return c.json({ error: "FORBIDDEN", message: "Chỉ admin mới có quyền xác thực" }, 403);
    }
    // ... rest
  } catch (err) { return handleError(c, err); }
}
```

## Shared Utility Extraction

<!-- Note: Tasks listed in logical dependency order. T02.4/T02.7 import getDepositBankInfo from bank-info.ts (T02.11) — implement T02.11 FIRST or add stub. -->

### T02.11: Extract `getBankInfo` to shared location — Deposit variant

**File:** `apps/api/src/modules/payments/domain/bank-info.ts` (NEW)

Deposit module uses `SEPAY_*` env vars (same bank account as old wallet topup). Payment module keeps `BANK_*` for backward compat.

```typescript
/** Deposit bank info — uses SEPAY_* env vars (ACB / configured bank) */
export function getDepositBankInfo(transferContent: string, amount: number) {
  const bankShortCode = process.env["SEPAY_BANK_SHORT_CODE"] || "ACB";
  const accountNumber = process.env["SEPAY_ACCOUNT_NUMBER"] || "";
  const accountName = process.env["SEPAY_ACCOUNT_NAME"] || "NEXUS PLATFORM";
  const bankName = process.env["SEPAY_BANK_NAME"] || "ACB (Ngân hàng Á Châu)";
  const qrUrl = `https://vietqr.app/img?acc=${accountNumber}&bank=${bankShortCode}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact`;
  return { bankName, bankShortCode, accountNumber, accountName, transferContent, qrUrl };
}

/** Payment bank info — uses BANK_* env vars (MB Bank, legacy) */
export function getBankInfo(transferContent: string, amount: number) {
  const bankShortCode = process.env["BANK_SHORT_CODE"] || "MB";
  const accountNumber = process.env["BANK_ACCOUNT_NUMBER"] || "0909090909";
  const accountName = process.env["BANK_ACCOUNT_NAME"] || "NEXUS PLATFORM";
  const bankName = process.env["BANK_NAME"] || "MB Bank (Ngân hàng Quân Đội)";
  const qrUrl = `https://vietqr.app/img?acc=${accountNumber}&bank=${bankShortCode}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact`;
  return { bankName, bankShortCode, accountNumber, accountName, transferContent, qrUrl };
}

export interface BankInfo {
  bankName: string;
  bankShortCode: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrUrl: string;
}
```

**File:** `apps/api/src/modules/payments/application/create-payment.usecase.ts`

```typescript
// CHANGE:
import { getBankInfo } from "../domain/bank-info.js";
// REMOVE: local getBankInfo function definition (lines 28-42)
```

**File:** `apps/api/src/modules/payments/application/get-payment.usecase.ts`

```typescript
// CHANGE:
import { getBankInfo } from "../domain/bank-info.js";
// REMOVE: local getBankInfo function definition (lines 14-28)
```

So that both `deposits` and `payments` modules import from same source.

### T02.12: Use case + route — Admin List All Deposits (GAP-1 fix)

`AdminDepositVerificationTable` (T07.6) cần list TOÀN BỘ deposits (chủ yếu pending) kèm thông tin người nạp. Thêm endpoint admin-only.

**File:** `apps/api/src/modules/deposits/infrastructure/persistence/deposit.repository.ts` (ADD)

```typescript
export async function findDepositsAdmin(params: {
  status?: "pending" | "verified" | "rejected";
  limit?: number;
  offset?: number;
}) {
  return prisma.deposit.findMany({
    where: params.status ? { status: params.status } : undefined,
    include: {
      user: { select: { id: true, name: true, display_username: true, email: true } },
    },
    orderBy: { created_at: "desc" },
    take: params.limit ?? 50,
    skip: params.offset ?? 0,
  });
}

export async function countDepositsAdmin(status?: string): Promise<number> {
  return prisma.deposit.count({ where: status ? { status } : undefined });
}
```

**File:** `apps/api/src/modules/deposits/application/list-all-deposits.usecase.ts` (NEW)

```typescript
import { findDepositsAdmin, countDepositsAdmin } from "../infrastructure/persistence/deposit.repository.js";
import { AppError } from "../../../shared/domain/app-error.js";

export async function listAllDepositsUseCase(
  adminId: string,
  opts: { status?: string; limit?: number; offset?: number },
) {
  if (!adminId) throw new AppError(403, "FORBIDDEN", "Chỉ admin mới có quyền truy cập");

  const [deposits, total] = await Promise.all([
    findDepositsAdmin({ status: opts.status as any, limit: opts.limit, offset: opts.offset }),
    countDepositsAdmin(opts.status),
  ]);

  return {
    deposits: deposits.map((d) => ({
      id: d.id,
      user: d.user ? { id: d.user.id, name: d.user.name, display_username: d.user.display_username } : null,
      amount: d.amount,
      transfer_content: d.transfer_content,
      status: d.status,
      proof_file_url: d.proof_file_url,
      bank_transaction_id: d.bank_transaction_id,
      verified_by: d.verified_by,
      created_at: d.created_at.toISOString(),
    })),
    total,
  };
}
```

**File:** `apps/api/src/modules/deposits/infrastructure/http/deposit.controller.ts` (ADD)

```typescript
export async function listAllDepositsHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (session.user.role !== "admin") {
      return c.json({ error: "FORBIDDEN", message: "Chỉ admin mới có quyền truy cập" }, 403);
    }
    const { status, limit = "50", offset = "0" } = c.req.query();
    const result = await listAllDepositsUseCase(session.user.id, {
      status,
      limit: Number(limit),
      offset: Number(offset),
    });
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}
```

**File:** `apps/api/src/modules/deposits/infrastructure/http/deposit.routes.ts` (ADD)

```typescript
// IMPORTANT: register BEFORE "/:id" — otherwise "admin" bị coi là :id
depositRouter.get("/admin/all", listAllDepositsHandler);
```

## Testing

- Integration test: POST /deposits → 201 with depositId + bankInfo
- Integration test: GET /deposits → list with correct userId
- Integration test: GET /deposits/:id → 200 with full deposit info
- Integration test: POST /deposits/:id/verify (admin) → wallet balance increased
- Integration test: POST /deposits/:id/verify (non-admin) → 403
- Integration test: idempotent verify (call verify twice) → second call does nothing
- Integration test: GET /deposits/admin/all (admin) → deposits with user info, pending filter works
- Integration test: GET /deposits/admin/all (non-admin) → 403

## Rollback

1. Remove `app.route("/api/deposits", depositRouter)` from index.ts
2. Old POST /wallet/topups, POST /payments still active — no breakage

## Deliverables

- [ ] `deposits/` module created with all files
- [ ] `bank-info.ts` extracted, old files updated
- [ ] Route mounted in index.ts
- [ ] Admin auth gate on verify endpoint
- [ ] check-types passes
- [ ] Manual test: create deposit → see bank info → verify → wallet balance increased
