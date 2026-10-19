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
