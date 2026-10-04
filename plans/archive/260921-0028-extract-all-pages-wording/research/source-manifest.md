# Source Manifest & Factual Extraction Contract (Strict 1-Page-1-File)

- **Baseline Git Commit:** `615c366d5f038557a17f55a37ae6895a3ce88cb6`
- **Timestamp:** 2026-09-21
- **Plan Reference:** `plans/260921-0028-extract-all-pages-wording/plan.md`
- **Output Directory:** `design-system/wording/pages/`
- **Rule:** "Mỗi một page sẽ là một file markdown" — Mỗi route/page.tsx có đúng 1 file markdown riêng biệt.

---

## 1. Non-Negotiable Contract

1. **Strict 3-Layer Structure per Document:**
   - **Layer 1: Page Context** (Route, Access, User, User Goals, Business Goals, Primary Action, Secondary Actions, Entry, Exit / Next Step, Product Facts / Constraints with code citations).
   - **Layer 2: Interactive Inventory** (Markdown tables with exactly 6 columns: `ID | Component / Vị trí | Type | Current wording | Action / Destination | State`).
   - **Layer 3: Page Notes** (Observed terminology variants with code references, verified code behavior, explicit unknowns/questions).
2. **Factual-Only Rule:**
   - Describe current UI & code reality 100% as-is.
   - **FORBIDDEN:** Rewrite columns (`Suggested wording`), subjective critiques, `Problem / Severity` columns, suggested changes.
3. **1 Page = 1 File Markdown:**
   - Không gộp nhiều trang khác nhau vào 1 file chung. Mỗi page.tsx (kể cả từng policy, từng settings sub-page, verify-email) có file markdown riêng biệt.

---

## 2. Exhaustive 1-to-1 Mapping Table (All 28 `page.tsx` Files)

| # | Route / File Path in `apps/web-1/app/` | Target File in `design-system/wording/pages/` | Type |
|---|---|---|---|
| 01 | `page.tsx` | `landing-page.md` | Page (Completed) |
| 02 | `auth/page.tsx` | `auth.md` | Page |
| 03 | `auth/verify-email/page.tsx` | `verify-email.md` | Page |
| 04 | `dashboard/page.tsx` | `dashboard-home.md` | Page |
| 05 | `dashboard/team-fit/page.tsx` | `team-fit.md` | Page |
| 06 | `dashboard/intake/page.tsx` | `intake-form.md` | Page |
| 07 | `dashboard/case/[id]/page.tsx` | `case-detail.md` | Page |
| 08 | `dashboard/case/[id]/payment/page.tsx` | `case-payment.md` | Page |
| 09 | `dashboard/payment/page.tsx` | `payment.md` | Page |
| 10 | `dashboard/payments/page.tsx` | `payments.md` | Code-verified Client Redirect to `/dashboard/wallet` |
| 11 | `dashboard/wallet/page.tsx` | `wallet.md` | Page |
| 12 | `dashboard/profile/page.tsx` | `profile.md` | Code-verified Server Redirect to `/dashboard/settings/profile` |
| 13 | `dashboard/settings/page.tsx` | `settings.md` | Page |
| 14 | `dashboard/settings/profile/page.tsx` | `settings-profile.md` | Page |
| 15 | `dashboard/settings/password/page.tsx` | `settings-password.md` | Page |
| 16 | `dashboard/settings/sessions/page.tsx` | `settings-sessions.md` | Page |
| 17 | `dashboard/settings/notifications/page.tsx` | `settings-notifications.md` | Page |
| 18 | `supporter/page.tsx` | `supporter.md` | Page |
| 19 | `supporter/case/[id]/page.tsx` | `supporter-case-detail.md` | Page |
| 20 | `supporter/settings/profile/page.tsx` | `supporter-profile.md` | Page |
| 21 | `supporter/settings/password/page.tsx` | `supporter-password.md` | Page |
| 22 | `supporter/settings/sessions/page.tsx` | `supporter-sessions.md` | Page |
| 23 | `admin/page.tsx` | `admin.md` | Page |
| 24 | `terms/page.tsx` | `terms.md` | Page |
| 25 | `privacy/page.tsx` | `privacy.md` | Page |
| 26 | `refund-policy/page.tsx` | `refund-policy.md` | Page |
| 27 | `fair-use-policy/page.tsx` | `fair-use-policy.md` | Page |
| 28 | `maintenance/page.tsx` | `maintenance.md` | Page |
