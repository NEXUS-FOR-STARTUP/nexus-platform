# Code Review Report — PR #26: Login Architecture (Google OAuth + Email OTP + Password)

**Date:** 2026-08-31  
**Target:** PR #26 (`feat/login-page-ui` → `feat/gap-analysis-tasks`)  
**Review Type:** Full Pipeline (Edge Case Scout + Adversarial Review + Production DB Analysis)  
**Author:** AI Reviewer (Code Review Team)

---

## 1. Executive Summary

PR #26 migrates the authentication interface and backend endpoints to support a multi-step login experience:
- **Primary Auth Methods:** Google OAuth, Email OTP, and Email + Password login.
- **Registration Flow:** Exclusively via Email OTP (direct `/sign-up/email` password registration is disabled).
- **Settings Enhancements:** First-time password creation (`POST /api/profile/password`) and password changing (`POST /api/profile/password/change`).

### Review History & Current State:
- **Phase 1 (Initial Diff):** Password authentication was completely disabled via backend auth hook (`PASSWORD_AUTH_DISABLED`). DB query confirmed 100% of staff/seed accounts (`@example.com`) would be locked out without OTP inbox access.
- **Phase 2 (Commits `fa22c65..db0c746`):** Team restored `/sign-in/email` password login while maintaining OTP alongside it, resolving the critical lockout blocker.
- **Phase 3 (Commits `62d85a3` & `d96ce2a`):** Resolved `#R2` (Google OAuth loading state fix), `#R4` (marked `verify-email` as `@deprecated`), and `#R8` (synced `AGENTS.md`).

---

## 2. Production Database Analysis (Read-Only Evidence)

A read-only inspection against the production PostgreSQL instance was conducted to quantify authentication dependencies:

### A. User Breakdown by Role & Provider
| Role | Total Users | Primary Account Provider | Status with PR #26 |
|---|---|---|---|
| `admin` | 1 | `credential` (`admin@example.com`) | Unlocked via restored `/sign-in/email` |
| `supporter` | 1 | `credential` (`supporter@example.com`) | Unlocked via restored `/sign-in/email` |
| `system` | 1 | N/A (service account) | Intact |
| `user` | 9 | `credential` (4) / `google` (5) | Intact (OTP or Password or OAuth) |

### B. Account Accessibility Matrix
- **Real inboxes** (e.g., `user@domain.com`): Can authenticate via Email OTP or Password or Google OAuth.
- **Dummy/Seed inboxes** (`@example.com`): Cannot receive OTP emails. They strictly depend on `/sign-in/email` password authentication. Restoring `/sign-in/email` was required to prevent total staff lockout.

---

## 3. Comprehensive Issue Tracker

| Issue ID | Severity | Status | Category | Affected File(s) | Description & Action |
|---|---|---|---|---|---|
| **#R1** | 🟠 **HIGH** | ✅ **FIXED** | Security Architecture | `apps/api/src/auth.ts`<br>`apps/api/src/modules/auth/infrastructure/account-lockout.service.ts` | **Per-Account Brute Force Defense**: Re-wired `accountLockoutService.checkLockout()` in `hooks.before` and `recordFailure()` / `recordSuccess()` in `hooks.after`. |
| **#R2** | 🟠 **HIGH** | ✅ **FIXED** (`d96ce2a`) | Client Resilience | `apps/web-1/app/auth/hooks/use-google-sign-in.ts` | **Google OAuth Loading Hang**: `setLoading(false)` was only in `catch`. Updated to check `res?.error` and translate auth errors. |
| **#R3** | — | 🔄 **Merged into #R1** | Code Hygiene | `apps/api/src/modules/auth/infrastructure/account-lockout.service.ts` | Merged into architectural decision for #R1 (re-wire vs delete). |
| **#R4** | 🟠 **HIGH** | ✅ **FIXED** (`62d85a3`) | Route Architecture | `apps/web-1/app/auth/verify-email/page.tsx` | **Legacy Standalone Verification**: Marked with `@deprecated` annotation. Kept for backwards compatibility with direct link hits. |
| **#R5** | 🟡 **NIT** | ⏳ **Backlog** | Security / Privacy | `apps/api/src/modules/profile/http/profile.routes.ts` | **User Enumeration**: `POST /api/profile/password-status` is public and returns `{ exists: boolean }`. Recommend returning generic response or requiring captcha if abused. |
| **#R6** | 🟡 **NIT** | ⏳ **Backlog** | Infrastructure | `apps/api/src/modules/profile/infrastructure/password-rate-limit.ts` | **In-Memory Rate Limiter**: `password-rate-limit.ts` uses an in-memory `Map`. Suitable for single instance; will need Redis/distributed store under multi-replica deployments. |
| **#R7** | 🟡 **NIT** | ⏳ **Backlog** | Governance / Legal | `privacy/page.tsx`<br>`refund-policy/page.tsx`<br>`PolicyDocumentLayout.tsx` | **Personal Email in Legal Policies**: `phungluuhoanglong@gmail.com` hardcoded because domain inbox is not yet active. Replace with official domain email once configured. |
| **#R8** | 🟡 **NIT** | ✅ **FIXED** (`62d85a3`) | Documentation | `apps/web-1/AGENTS.md` | **Stale Route References**: Updated documentation to reflect OTP + Password flows and marked legacy routes as deprecated. |

---

## 4. Architectural Deep Dive: #R1 Decision (Per-Account Lockout)

### Context:
Prior to PR #26, `auth.ts` intercepted `/sign-in/email` and invoked `accountLockoutService.checkLockout(email)`:
- Failed attempts tracked per email.
- Account temporarily locked for exponential backoff on repeated failures.

In PR #26, `/sign-in/email` was restored without re-wiring `accountLockoutService`.

### Evaluation Options:

#### Option A: Re-wire `accountLockoutService` (Recommended for OWASP compliance)
- **Implementation:** Wire `checkLockout(email)` in `auth.hook.ts` before authentication, and register `recordSuccess(email)` / `recordFailure(email)` callbacks.
- **Benefit:** Defense against distributed proxy attacks targeting single high-privilege accounts (`admin`, `supporter`).
- **Cost:** Maintains ~173 lines of existing service code and its test suite.

#### Option B: Rely Exclusively on Better Auth IP Rate Limiting
- **Implementation:** Delete `account-lockout.service.ts` and `account-lockout.test.ts`.
- **Benefit:** Minimal codebase complexity.
- **Risk:** Distributed credential stuffing / brute-force bypassing IP limits.

---

## 5. Summary of Commits Applied in Review

1. **`62d85a3`** — `docs(auth): mark legacy verify-email as deprecated and sync agents guide`
   - Added `@deprecated` JSDoc to `apps/web-1/app/auth/verify-email/page.tsx`.
   - Updated `apps/web-1/AGENTS.md` lines 17 and 75.
2. **`d96ce2a`** — `fix(web): reset loading state and translate errors in google sign-in hook`
   - Fixed `useGoogleSignIn` error capture and loading state release.
   - Connected `translateAuthError` for translated user feedback.

---

## 6. Pre-Merge Checklist

- [x] Password login restored for staff/seed compatibility
- [x] Google OAuth loading leak resolved (`#R2`)
- [x] Legacy routes deprecated and documented (`#R4`, `#R8`)
- [x] TypeScript type checking clean across all packages (`npm run check-types` passed)
- [x] Per-Account lockout defense re-wired and verified (`#R1`)
- [ ] Push local commits to remote branch (`git push origin feat/login-page-ui`)
