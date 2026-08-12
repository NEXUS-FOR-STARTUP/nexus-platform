# Codebase Review — User Wallet VND Plan

**Plan:** `plans/260811-1100-user-wallet-vnd/`  
**Review Mode:** Codebase (full cross-reference audit)  
**Date:** 2026-08-11  
**Reviewer:** ck:code-review skill, explore subagent  

**Scope:** All 8 plan files + 2 research docs + 6 codebase files cross-referenced.  
**Findings:** 37 total (5 CRITICAL, 12 HIGH, 15 MEDIUM, 5 LOW).

---

## CRITICAL (5) — Blockers to plan execution

### C1 — ServicePackage model drops existing `price` column

**Files:** phase-01-schema-migration.md:111-123, prisma/schema.prisma:118-136, red-team-findings.md:173-177

Phase-01 `ServicePackage` model omits `price`, `previous_price`, `last_price_changed_at`, `last_price_changed_by` that exist in current production schema. This is functionally a DROP COLUMN.

**Actual schema.prisma (line 118-136):**
```prisma
model ServicePackage {
  id                    String            @id @default(cuid())
  name                  String
  price                 Int
  previous_price        Int?
  last_price_changed_at DateTime?
  last_price_changed_by String?
  features              Json              @default("[]")
  is_active             Boolean           @default(true)
  created_at            DateTime          @default(now())
  updated_at            DateTime          @updatedAt
  initial_tokens        Int               @default(0)
  token_bonus_period    String            @default("none")
  token_bonus_days      Int               @default(0)
  initial_credits       Int               @default(1)
  ...
}
```

Phase-01 model drops: `price`, `previous_price`, `last_price_changed_at`, `last_price_changed_by`, `initial_tokens`, `token_bonus_period`, `token_bonus_days`, `initial_credits`.

**Consumers that read `price`:**
- `packages.controller.ts:6` — GET /api/packages
- `list-packages.usecase.ts` — list all packages with prices
- `AdminPackagesSettings.tsx` — FE admin package management
- `payment.repository.ts:195` — `Math.round(amount / 39000)` quantity calc

**Fix:** Keep all existing columns. Add `serviceTypeId` as nullable FK. Add `service_pricing` as secondary price source. Don't drop anything.

### C2 — Wallet transactions deduct wrong user  

**File:** phase-05-workflow-integration.md:30,59,87

All three integration points use `event.actorId` to identify the wallet owner:

```typescript
// hasCredit guard (line 30)
const userId = event.actorId;

// subtractCredit action (line 59)
const userId = event.actorId;

// refundCredit action (line 87)
const userId = event.actorId;
```

For workflow transitions:
- **T5 (admin accept):** actor = admin → checks admin's wallet, not case owner's
- **T11 (supporter output):** actor = supporter → deducts supporter's wallet
- **T13 (veto):** actor = admin → refunds to admin's wallet

**Fix:** Use `caseRecord.owner_auth_user_id` (the case owner), not `event.actorId`.

### C3 — Route mount missing `/api` prefix  

**File:** phase-02-wallet-service.md:319, phase-06-frontend-ui.md:36,44,51

Phase-02 mounts: `app.route('/wallet', walletRoutes)`  
All 11 existing mounts use: `app.route('/api/...', ...)` (apps/api/src/index.ts:146-156)  
FE api-client baseURL: `${API_URL}/api` (api-client.ts:5)  
FE calls: `/wallet/balance` → resolves to `/api/wallet/balance` vs server `/wallet/balance` → **404**

**Fix:** `app.route('/api/wallet', walletRoutes)`

### C4 — Red-team amendments claimed applied but zero changes in phase files  

**File:** plan.md:146-155 (Amendments table) vs all phase files

plan.md states "Critical amendments applied to phase files" but every amendment remains unapplied:

| Amendment | plan.md claim | Phase file reality |
|---|---|---|
| A1: tx param to WalletService | "WalletService methods accept optional tx param" | phase-02 methods still open own `prisma.$transaction()`, no tx param |
| A2: sum actual payment.amount | "Sum actual payment.amount per case" | phase-07:27 still `CREDIT_PRICE_VND = 39000` flat ratio |
| A3: create wallet at registration | "Tạo wallet row trong auth hook" | phase-02:84-92 still lazy-create (findUnique→create) |
| A4: validate amount in webhook | "So sánh sepayAmount với topup.amount" | phase-03:114-144 no amount comparison |
| A5: require idempotencyKey | "Bắt buộc idempotencyKey" | phase-02:229,268 still `idempotencyKey ?? randomUUID()` optional |
| A6: Case.use_wallet column | "Thêm cột Case.use_wallet" | phase-01 schema has no such column; phase-05:131 still date-based flag |

Also: red-team F6 (backfill existing users), F8 (reconciliation endpoint), F9 (topup expiry), F10 (notification), F11 (deprecate price_amount), F12 (FE empty state) — none addressed in plan files.

### C5 — Auth middleware from wrong source  

**File:** phase-02-wallet-service.md:293-294

```typescript
import { authMiddleware } from '../../../../auth';
```

`src/auth.ts` is Better Auth configuration — not middleware. Real auth patterns in codebase:
- `getSession()` helper (used by payments, cases modules)
- `requireAuth` from `shared/infrastructure/middlewares/auth.js`
- `c.get('user')` pattern (requires middleware that injects user object)

No existing module imports from `../../../../auth` for middleware.

**Fix:** Use `getSession()` pattern matching existing modules (cases/payments).

---

## HIGH (12) — Bugs and missing features

### H1 — ESM `.js` suffix missing from all imports  

**Files:** phase-02:81,165,173,293,294, phase-03:45, phase-04:39, phase-05:22 vs apps/api AGENTS.md

AGENTS.md: "NodeNext-style relative imports use `.js`". All real files follow this (credit-ledger.repository.ts:1 `"../../../../db.js"`). All plan snippets omit `.js`.

### H2 — getBalance returns 0 for missing wallet (G2 not fixed)  

**File:** phase-02:94-100, phase-03:177, case.types.ts:84-87

```typescript
export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await prisma.userWallet.findUnique({ where: { userId }, select: { balance: true } });
  return wallet?.balance ?? 0;
}
```

Old code: `requireCredits()` silently skips if `credit_ledgers` table missing (P2021 → return case.allow). New code: silently returns 0 if wallet row missing. Same silent-skip behavior.

Phase-03:177 states "Không liên quan" — but the gotcha IS relevant. `WalletNotFoundError` class exists (phase-02:68-73) but is never thrown from getBalance.

### H3 — SePay webhook deposit + topup update not in same transaction  

**File:** phase-03:114-144

```typescript
// Two separate calls, no shared transaction
await walletService.deposit(topup.userId, topup.amount, 'topup', topup.id, txDepositKey);
await prisma.walletTopup.update({ where: { id: topup.id }, data: { status: 'completed', ... } });
```

If deposit succeeds but update fails: money in wallet, topup still pending. Retry hits P2002 duplicate key. Non-atomic.

### H4 — WalletService deposit accepts negative amount  

**File:** phase-02:185-191

No `amountVnd > 0` guard anywhere. Negative deposit = withdrawal via deposit method. Undefined behavior.

### H5 — Phase-07 migration uses nonexistent Prisma field names  

**File:** phase-07:31-44

```typescript
const cases = await prisma.case.findMany({
  where: { credit_ledgers: { some: {} } }, // Empty filter syntax invalid
  select: {
    owner_id: true,    // Actual: owner_auth_user_id (camelCase: ownerAuthUserId)
    credit_ledgers: {  // Actual relation name unknown without regenerated client
      select: { balance_after: true }  // Prisma maps snake_case, actual accessor depends on client
    },
  },
});
```

Also: `import { prisma } from '../apps/api/src/db'` — path crosses project boundaries, root `scripts/` dir may not exist.

### H6 — No amount validation in SePay webhook matching  

**File:** phase-03:114-144

Webhook finds topup by `transferContent` + `status = 'pending'` but never compares `sepayAmount` with `topup.amount`. User creates topup 100k, transfers 50k → gets 100k credited.

### H7 — No admin manual-verify for wallet_topups (P5 fallback)  

**File:** phase-01:77-79, brainstorm §1 (P5), §2 (G3)

Schema supports manual verification (`verifiedBy`, `verificationSource` = "manual") but no usecase/route lets admin mark a topup completed. Old payment flow has admin-verify proof upload. Wallet flow has no equivalent.

### H8 — Deduction timing: case creation vs T5/T11 never resolved  

**File:** brainstorm:92-96, phase-05, research:255-258

Brainstorm §4: "Tạo case & chọn dịch vụ → hệ thống trừ tiền từ ví" (deduct at case creation).  
Phase-05: wires subtractCredit→withdraw at T11 (supporter output) and hasCredit guard at T5 (admin accept).  
Research §4 diagram: "T5 Accept → guard check ví → trừ VND; T11 → trừ credit (lượt)" — suggests two separate deductions.

Three different models in three documents. Plan never arbitrates.

### H9 — Brainstorm §4 claims refund at T12 but workflow Q3 says no-refund  

**File:** brainstorm:98, phase-05, workflow plan phase-06:26 Q3

Brainstorm: "Admin từ chối case (T12) → +39,000đ về ví".  
Workflow plan Q3: "T12 reject thường: supporter đã render → giữ credit; chưa render → credit chưa trừ = không mất gì".  
Phase-05 only wires refundCredit to T13 veto.

Brainstorm contradicts workflow Q3. Plan never arbitrates.

### H10 — Phase-05 guard snippet has `tx` in scope but guard receives `{ context, event }`  

**File:** phase-05:29-42, phase-02-transition-registry.md:55

Guard signature: `hasCredit: ({ event })` (no tx parameter). Phase-05 snippet calls `getCaseForTx(tx, caseId)` with undefined `tx`.

### H11 — VIP combo package has no UPDATE mapping in seed  

**File:** phase-01:157-162

Seed UPDATEs map `ai_review`, `supporter_review`, `team_fit` via name-ILIKE. No `vip_combo` branch. Therefore phase-01:172 pricing INSERT `FROM service_packages WHERE service_type_id = vip_combo` returns zero rows → VIP pricing never seeded.

### H12 — G3 `payment_status:"not_required"` kept but success criteria claims fixed  

**File:** phase-03:178, plan.md:118, ai-engine.routes.ts:103

Success criteria: "5 gotchas (G1-G5) fixed"  
Phase-03: "Giữ nguyên, không sửa" for G3  
Fact: G3 is NOT fixed and plan explicitly refuses to fix it.

---

## MEDIUM (15) — Pattern violations and missing details

### M1 — `infrastructure/http/` path deviates from codebase convention  

All existing modules use `http/` at module root (cases/http, payments/http, packages/http). Plan uses `infrastructure/http/` — no existing module does this.

### M2 — WalletService class + singleton pattern — no existing module uses this  

All existing usecases are exported standalone functions. No `service.ts` class with constructor/new anywhere in codebase. Notifications has `listener/relay` files but different pattern.

### M3 — No `handleError`/`AppError` error mapping in wallet routes  

API convention: errors thrown as `AppError` caught by `handleError` middleware. Phase-02 routes throw `InsufficientBalanceError`/`WalletNotFoundError` with no AppError mapping. No `handleError` import.

### M4 — `@explore` result inconsistent with plan.md:62  

plan.md:62 lists `sepay-topup-webhook.usecase.ts` as MỚI file under wallet module. Phase-03 creates `wallet-topup.usecase.ts` + modifies existing sepay-webhook file. The phantom file path never created.

### M5 — CreditLedger `createCreditEntry` stays writable with no disable mechanism  

plan.md:76 says "KHÔNG ĐỔI credit-ledger.repository.ts". But plan also says "không ghi mới sau migration". No code freezes the write function. Old usecases still call `createCreditEntry` (case.repository.ts:564, payment.repository.ts:202, veto-case.usecase.ts:40).

### M6 — `@explore` ServicePackage migration note cites phantom columns  

phase-01:126: "`price_amount`, `price_currency`, `description`" — none exist. Actual columns: `price Int`, `previous_price`, `last_price_changed_at`, `last_price_changed_by`. Red-team F11 repeats same phantom columns.

### M7 — FE: `any` type escapes in components  

phase-06:103 `useState<any>`, phase-06:196 `(tx: any)`, phase-06:203 `transaction: any`. AGENTS.md anti-pattern.

### M8 — FE: TanStack Form convention violated  

web-1 AGENTS.md: "TanStack Form for form state management". WalletTopupModal uses `useState` for amount instead of TanStack Form.

### M9 — FE: hardcode 39,000 not fixed — no phase owns the replacement  

phase-04:172 defers fix to "phase 05 hoặc phase riêng". Phase-05 never touches hardcode locations (CreditQuantityModal.tsx:10, upgrade-package.usecase.ts:10, payment.repository.ts:195). No deliverable owns replacing them.

### M10 — No backfill user_wallets for existing users  

Phase-07 only creates wallets for cases with credit > 0. Users with zero credit have no wallet row. First wallet access → race condition via lazy-create.

### M11 — No `WalletTopup.expiresAt` — stale pending topups accumulate forever  

Red-team F9 finding not applied. Transfer_content collision risk over time.

### M12 — No event emission after deposit (WALLET_CHANGED)  

Brainstorm §5:158 specifies "event bus (emit WALLET_CHANGED sau commit)". Phase-02 has zero `emitEvent` calls.

### M13 — No reconciliation endpoint/health check  

plan.md:111 lists "Reconciliation query định kỳ SUM(ledger) === cache" as risk mitigation. No phase deliverable implements it.

### M14 — `WalletTopup.transferContent` no uniqueness constraint  

`payments.transfer_content` has `@@unique` (schema.prisma:349). `WalletTopup.transferContent` has no unique constraint — two users could randomly generate same 6-char code.

### M15 — Phase-07 script path `../apps/api/src/db` — no `scripts/` dir in project  

Project has `scripts/fix-stuck-cases-2026-08-09.sql` (workflow plan F15) but no evidence of `tsx` scripts with ESM imports from api package.

---

## LOW (5) — Documentation and polish

### L1 — plan.md frontmatter `blockedBy` contradicts body text  

frontmatter line 9: `blockedBy: [260809-1030-workflow-engine-refactor]` (whole plan blocked)  
body line 43: "phases 01-04, 06, 07 không conflict — có thể bắt đầu ngay" (most phases independent)

### L2 — Card/Paper components: `shadow-sm` anti-pattern checked  

Phase-06 components use `withBorder` instead of shadow ✓. Existing CreditPanel.tsx:61 uses `flex ... items-center` but on plain divs, not Mantine components — no violation.

### L3 — No QR code in topup response  

Phase-03:18 flow diagram promises `qr_url` in response. Phase-03:70-75 `createTopupUseCase` returns `bankInfo` only — no QR.

### L4 — SePay webhook topup matching could match wrong user  

`findFirst({ where: { transferContent, status: 'pending' } })` — if user A has pending topup with same transferContent as user B's completed payment, the webhook matches user A's pending record. No user-scoped filter.

### L5 — Brainstorm §8 decision 5 (admin audit API) not in plan  

Specifies: "Thêm API list wallet_transactions (filter user/case/date)". Plan has only user-facing `getHistory(userId, limit, offset)`. Admin audit dashboard API missing.

---

## GAPS MATRIX — Brainstorm promises vs plan coverage

| Brainstorm promise | Phase covering | Verdict |
|---|---|---|
| P1: Credit không chết trong case bị hủy | All wallet phases | ✓ Covered |
| P2: Refund thật (không chỉ reset số) | Phase 05 | ✓ Covered (T13 only) |
| P3: Chuyển credit giữa case | Plan solves via shared wallet | ✓ Covered |
| P4: Nhiều gói dịch vụ | Phase 04 | ✓ Covered |
| P5: Tự động hoàn toàn (không admin duyệt) | Phase 03 | ⚠ Partial — no admin fallback |
| G1: SePay dedup in-memory | Phase 03 | ✓ Covered |
| G2: Credit check silent skip | Phase 02 (only halfway) | ✗ Same pattern persists |
| G3: payment_status "not_required" | Phase 03 (explicitly not fixed) | ✗ Not fixed |
| G4: Veto key Date.now() collision | Phase 05 | ✓ Covered |
| G5: 39k hardcode 3 places | Phase 04 (deferred, no owner) | ✗ Not fixed |
| Event bus WALLET_CHANGED | — | ✗ Missing |
| Admin audit API | — | ✗ Missing |
| WalletTopup admin manual verify | — | ✗ Missing |
| Reconciliation health check | — (risk list only) | ✗ Missing |
| Payment → WalletTopup lifecycle doc | — | ✗ Missing |

---

## SUMMARY

| Severity | Count | Must-fix before implementation? |
|---|---|---|
| CRITICAL | 5 | Yes — plan is unbuildable without fixes |
| HIGH | 12 | Yes — will break at runtime |
| MEDIUM | 15 | Should fix — convention violations + missing features |
| LOW | 5 | Nice to fix |
| **Total** | **37** | |

### Root causes of quality issues

1. **Phase files written before red-team amendments applied** — plan.md amendment table exists but no phase file was actually edited to match.
2. **`event.actorId` vs `caseRecord.owner_auth_user_id`** — copied from brainstorm verbatim without verifying against workflow transition semantics.
3. **`/api` prefix** — route mount convention different from every existing module mount.
4. **Auth pattern** — used imaginary `authMiddleware` import instead of real `getSession()`.
5. **ServicePackage schema** — migration note described phantom columns not present in actual prisma/schema.prisma.
6. **Phase-07 script** — untested pseudocode with wrong Prisma field names and invalid query syntax.
