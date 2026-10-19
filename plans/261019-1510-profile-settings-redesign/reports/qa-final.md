# QA final

Run: 2026-10-19, branch feat/landing-redesign.

| Gate | Result |
|---|---|
| `bunx eslint app/dashboard/settings --max-warnings 0` | pass (fixed 3 `any` in useSessionMutations, `set-state-in-effect` in NotificationPreferencesForm via derived optimistic value) |
| `bun run check-types` | no errors under `settings/`; errors remain in case-detail plan files (GuidedDocumentsWorkspace, OverviewTab...) owned by another plan |
| Rule greps in `settings/` (`size="xs"`, apiClient in tsx, try{, as any, hex, CP[1-4]) | clean |
| Files <=200 lines | max 171 |
| Browser smoke 1440/768/390 light/dark, admin/supporter/writer regression, keyboard | NOT RUN |
| taste `lint.mjs` / `inspect.mjs` | NOT RUN (skill scoped to public pages) |

## Open for owner
Q-P1 (4 notification groups need backend), Q-P2 (location/last-seen need backend), Q-P3..P7 defaults applied.
Avatar errors now inline only (no duplicate toast) for client-side validation; server errors still toast.

## Run 2 (authenticated, student account, 1440 + 390, light/dark partial)
- Taste `lint.mjs` on `settings/`: 0 FAIL, 0 WARN.
- Profile: Save disabled initially / after revert / trailing-space only; enabled on real edit; empty name error; invalid avatar -> inline `role=alert`; email description; delete modal opens via keyboard, confirm disabled until XOA, Esc closes, focus returns to opener. Modal input did not receive autofocus (not fixed).
- Notifications: label/input click toggles, focus kept, round-tripped to original value.
- Password: "Đặt mật khẩu" mode only (account has no password); change mode NOT tested.
- Sessions: rows, StatusChip, bulk button render. Bug found at 390: revoke button clipped -> fixed (`.revoke { flex-shrink: 0 }`), re-verified.
- 390: no horizontal overflow; strip + underline OK. Dark: profile OK.
- Not tested: save/delete/revoke (real account), 768, admin/supporter/writer routes, API suite.
