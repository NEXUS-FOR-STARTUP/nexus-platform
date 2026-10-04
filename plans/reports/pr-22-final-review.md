# PR #22 Final Code Review Report
**Date:** 2026-08-31
**Target:** PR #22 (Branch: `feat/gap-analysis-tasks` into `dev`)

## 1. Scope of Review
The review focused on the largest critical components and files that were modified:
- `prisma/schema.prisma` and generated database migrations.
- Authentication & Security (`auth.ts`, `account-lockout.service.ts`).
- Financial Core (`wallet.service.ts`, `payments.controller.ts`).
- TypeScript integrity.

## 2. Verdict
🛑 **BLOCKED** due to 1 Critical Security Issue (Resource Exhaustion / DoS).

## 3. Findings

### 3.1. 🛑 CRITICAL BLOCKER: Memory Leak / Resource Exhaustion DoS in `account-lockout.service.ts`
- **Location:** `apps/api/src/modules/auth/infrastructure/account-lockout.service.ts`
- **Issue:** The `accountLockoutService` uses an unbounded in-memory `Map<string, AttemptRecord>` to store login attempts. 
- **Exploit Vector:** An attacker can perform a Denial of Service (DoS) attack by sending high-volume requests to `/sign-in/email` with unique, randomly generated emails. Each failed attempt creates a new record in `this.store`. Because the map has no maximum size limit and no background task sweeping expired records (cleanup only happens lazily if the *same* email is checked again), the Node.js process memory will grow infinitely until it crashes with an Out-of-Memory (OOM) error.
- **Required Fix:** 
  - Add a maximum size limit to `this.store` (e.g., `maxStoreSize = 10000`).
  - When the size is exceeded, implement an eviction policy (e.g., clear the oldest records, run a sweep to remove expired lockouts, or wrap it in an `lru-cache`).

### 3.2. ✅ Database Schema & Migrations (Đối soát so với Deploy Log `0442a6a`)
- **Location:** `prisma/schema.prisma` & `prisma/migrations/`
- **Status:** **PASS**. 
- **Chi tiết đối soát từ commit `0442a6a` (ngày 10/08/2026) đến HEAD (`dev`):**
  - Quá trình quét bằng `git diff 0442a6a..HEAD -- prisma/migrations` phát hiện 14 file migration chưa được deploy lên production.
  - **Phân loại tính an toàn (theo `prisma-migration-safety.md`):** **Additive (Safe change)**.
  - Các thay đổi bao gồm: Thêm các bảng mới (`case_chat_read_states`, `notification_preferences`, `refunds`, v.v.) và thêm các cột nullable/optional mới. Không có lệnh `DROP TABLE` nào đối với các bảng đang chứa dữ liệu production.
  - Lệnh `DROP COLUMN` duy nhất xuất hiện trong migration `20260828210000_slim_notification_preferences`, tuy nhiên lệnh này chỉ drop các cột của bảng `notification_preferences` – một bảng hoàn toàn mới được tạo ở ngay migration trước đó (chưa từng lên production). 
  - **Kết luận rủi ro dữ liệu:** Không có rủi ro mất mát dữ liệu (No destructive SQL on existing production tables). Không vi phạm "Absolute Forbidden Commands". Báo cáo an toàn tuyệt đối cho việc chạy `npx prisma migrate deploy` trong lần deploy tới.

### 3.3. ✅ Wallet Core
- **Location:** `apps/api/src/modules/wallet/application/wallet.service.ts`
- **Status:** **PASS**.
- **Details:** Transaction flows correctly pass the `Prisma.TransactionClient` to sub-methods or generate a new transaction block. The usage of `getOrCreateWalletInTx` correctly acts as a safe fallback ensuring users always have a wallet record without throwing a `WalletNotFoundError`.

### 3.4. ✅ Payments Controller
- **Location:** `apps/api/src/modules/payments/http/payments.controller.ts`
- **Status:** **PASS**.
- **Details:** Concurrency protection is robustly implemented. `uploadPaymentProofHandler` uses `updateMany` with a `status: "pending"` constraint to avoid race conditions. Cleanup of uploaded files on database update failure (`cleanupUploadedProof`) works properly.

### 3.5. ✅ TypeScript Compilation
- **Location:** Workspace `apps/api` and `apps/web-1`.
- **Status:** **PASS**.
- **Details:** Both `npx tsc --noEmit` checks executed cleanly, proving that type definitions are solid across the 300+ file PR.

## 4. Next Steps
1. Apply the fix for the memory leak in `account-lockout.service.ts`.
2. Run standard local tests.
3. Commit and merge the PR.