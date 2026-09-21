# Phase 07 — Payments and wallet wording inventory

## Overview
- **Owner:** `WordingPaymentsWallet`
- **Effort:** 3h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/case-payment.md`

## Evidence scope
`/dashboard/payment`, `/dashboard/payments`, `/dashboard/wallet`, `/dashboard/case/[id]/payment`; `PaymentBankInfo`, `ProofUpload`, payment history, `WalletTransactionTable`, `WalletTopupModal`, `WalletBalanceCard`, deposit/order/payment query and mutation error/loading/pending/verified/rejected states.

## Steps
1. Map all four route entries and route aliases with CodeGraph. Trace displayed strings through payment/wallet components, hooks, result types and notifications; record obsolete/redirect/absent behavior only where source proves it.
2. Write one multi-route Page Context with separate route/access facts, payment/deposit constraints and explicit unknowns.
3. Inventory by route and modal: bank instructions, QR/proof data labels, amount/input validation, history/filter/table empty states, status badges, top-up, disabled/pending/submission/error/toast states, and code-proven destinations.
4. Keep terminology variants (`payment`, `deposit`, wallet/credit/order) factual in Page Notes.

## Acceptance criteria
- Exactly one canonical `case-payment.md` covers all four routes; no `payments-and-wallet.md` or separate wallet file is created.
- All route-specific and modal states use exact three-layer structure and six-column Inventory tables.
- Wording/actions/states are code-evidenced; no inferred finance policy or wording proposal is added.

## Risk and rollback
- **Risk:** route aliases/deprecated APIs cause invented behavior (High). Mitigate by route-entry and UI-handler evidence requirement. Regenerate only `case-payment.md`; no financial action, data migration, or API change occurs.
