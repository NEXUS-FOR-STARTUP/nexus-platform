## Foundation report: apps/web-1 (read-only; nothing edited, nothing built)

Not verified: how the tokens render in a real browser, and whether `lint` currently passes.

### 0. Landing plan is mostly already shipped
- **Phase 1 (Inter Tight toàn app) is done.** Commit `78691ec`. `app/layout.tsx` already uses `Inter_Tight` with `--font-inter-tight`. `globals.css:46-48,184,188` and `providers.tsx:30,36` already point to it. The only "Google Sans" hits are in a PDF under docs.
- **Phase 3 is done.** `OverviewIdeaGuideAlert.tsx` exists and is mounted at `workspace/OverviewTab.tsx:81`. Commits `ad6cb5f` and `00a50c9`. The plan still says `pending`.
- **Theme:** `providers.tsx:41-44` already adds the default Info icon for every Alert (`e97612a`).
- **Working tree:** only `CaseCard.tsx` and `globals.css` are modified. The `globals.css` change is an uncommitted `--app-text-meta: 0.9375rem` (+1 line, `:78`).
- **Plan Phase 2 (landing, `components/landing/*`):** touches no dashboard files and no `globals.css` tokens. Its tokens are `--lp-*` in CSS modules. The plan says explicitly "không đổi theme toàn app" and "không đưa vào globals.css".

### 1. Token table
Mockup values are from `design-system/mockups/*/css/base.css`. The mockup has no `--app-text-meta`; that var exists only in web-1.

| Mockup token | Value | web-1 equivalent | Status |
|---|---|---|---|
| `--page` | #f8fafc | `--color-bg` (`:102`), Tailwind `bg-bg-app` | exists |
| `--surface` / `--ground` | #fff | `--color-surface` (`:103`), `bg-surface-app` | exists |
| `--surface-2` | #f1f5f9 | `--color-surface-soft` (`:104`) | exists |
| `--line` | #e2e8f0 | `--color-border` (`:106`), `border-border-app` | exists |
| `--line-strong` | #cbd5e1 | `--color-border-strong` (`:107`) | exists |
| `--ink` | #0f172a | `--color-text` (`:108`) | exists |
| `--muted` | #475569 | `--color-text-muted` (`:109`) | exists |
| `--field` | #94a3b8 | none (`--color-text-subtle` is #64748b) | missing |
| `--brand` / `-hover` / `-soft` / `-subtle` | #2563eb / #1d4ed8 / #dbeafe / #eff6ff | `--color-brand*` (`:81-84`) and Mantine `brand` palette (`providers.tsx:17-28`) | exists |
| `--ok` / `--ok-soft` | #10b981 / #d1fae5 | `--color-success` / `-soft` | exists |
| `--warn` / `--warn-soft` | #f59e0b / #fef3c7 | `--color-warning` / `-soft` | exists |
| `--err` / `--err-soft` | #ef4444 / #fee2e2 | `--color-danger` / `-soft` | exists |
| chip text colors | #1e40af, #065f46, #92400e | none. Mantine `variant="light"` derives text from the color scheme. | missing; use Badge `light` |
| `--t-title` | 24px | none | missing |
| `--t-section` | 18px | none | missing |
| `--t-body` | 16px | none. `--app-text-sm` resolves to 16px at ≥640px. | missing |
| `--t-note` | 14px | `--app-text-sm` is 14px only below 640px | missing |
| font weights 400/500 | | headings forced to 600 (`globals.css:188-191`) | conflict |
| radius 8 | | Mantine `defaultRadius` is unset, so the default is `sm` (4px). Cards use `radius="md"` (8px) per call site. | missing as a global token |
| topbar 56px | | `DashboardShell.tsx:47` is `h-16` (64px) | differs |
| `--gap-section` 32/48 | | none | missing |

**`--app-text-xs/sm` issue** (`globals.css:76-77,131-132`):
- Below 640px: xs is 13px and sm is 14px.
- At ≥640px: both become 16px (`1rem`).
- Effect: Mantine `size="xs"` and `size="sm"` (mapped in `providers.tsx:31-34`) and Tailwind `text-xs`/`text-sm` (`:50-51`) all render 16px on desktop. A "14px note" cannot be expressed with `size="xs"` or `size="sm"` today.
- `--app-text-meta` (15px, uncommitted) looks like a partial attempt at this.

The dark theme overrides `--color-*` and some `--mantine-color-dark-*` (`:136-178`), so any new token needs a dark value.

### 2. Mantine theme and how things are styled today
- **Theme (`providers.tsx:14-45`):**
  - `createTheme` sets only `primaryColor`, the `brand` palette, `fontFamily`, `fontSizes {xs, sm}`, `headings h6`, and the `Alert` default icon.
  - There is no `defaultRadius`, no Tabs/Badge/Button/Paper/Modal overrides, and no `postcss-preset-mantine` mixin usage in the theme.
  - `postcss.config.mjs` loads `@tailwindcss/postcss`, `postcss-preset-mantine`, and `postcss-simple-vars` with breakpoints.
- **`globals.css` global overrides (`:196-216`):**
  - `.mantine-Card-root, .mantine-Paper-root, .mantine-Menu-dropdown, .mantine-Modal-content, .mantine-Drawer-content, .mantine-Select-dropdown, .mantine-Combobox-dropdown, .mantine-Popover-dropdown` get `background-color` and `border-color` with `!important`.
  - `.mantine-Paper-root.stage-card` gets `border: 1.5px solid var(--stage-color) !important`.
  - Table borders are also forced with `!important`.
  - Consequence: a Paper with a different border color needs `!important` or a higher-specificity class.
- **Tabs:**
  - Wallet uses `variant="pills" radius="md"` (`wallet/page.tsx:42`). `WalletTabsList.tsx` (12 lines) is just a wrapper with `className="border-none bg-transparent p-0"`.
  - Stage detail uses `variant="pills"` (`StageDetail.tsx:102`).
  - Case workspace tabs are a custom `div`/buttons (`WorkspaceTabs.tsx:48`, 76 lines, `shadow-sm rounded-t-2xl`), not Mantine Tabs.
- **Badge:** inline `Badge variant="light" color=… size="md"` plus `className="font-body text-sm"` (`CaseCard.tsx:59,63`). Color and label come from `getStageBadgeProps` / `getPaymentBadgeProps`, which are used only in `CaseCard.tsx`; I did not locate their definition. `CaseStatusHeader.tsx:152` builds its own pill from `<span>` + `badgeClass`.
- **Cleanest place for the new pieces, following existing patterns:**
  - **Tabs variant A (underline):**
    - Preferred: a small CSS module (e.g. `app/dashboard/_components/tabsUnderline.module.css`) passed through Mantine `classNames`, or `Tabs.extend({ classNames })` in the theme.
    - Reason: the repo has no theme-level Tabs override, and four existing CSS modules (`JourneySidebar`, `GuidedTemplateCard`, `DoubleNavbar`, auth) already use the module pattern.
    - Caveat: the module can only be applied once, as `className` or extension. Wallet and settings tabs currently use `pills` and `WorkspaceTabs` is custom, so each needs migrating.
  - **Chip light:** a shared `StatusChip` wrapping `Badge variant="light"` in `components/ui/`. The mockup's custom text colors are not worth replicating.
  - **Expandable row:** a shared component, because there are 3 different local patterns today.
    - `RoundCard.tsx:107-117` and `TabReportFindings.tsx:142-152` use a Button toggle.
    - `StageGradingPanel.tsx:205` uses `Collapse`.
    - `TeamFitReportParts.tsx:34,103` uses `Accordion variant="separated"` with `ACCORDION_CLASSES = { item: "border border-border-app" }`.
  - **Radius 8:** I would put `defaultRadius: "md"` in the theme, but the landing plan forbids theme-wide changes. That is an ordering decision between the two plans (see §4).

### 3. Existing shared components vs. what the mockups introduce

| Mockup piece | Existing in web-1 |
|---|---|
| Copy button | Mantine `CopyButton` + `Tooltip` + `Badge`/`ActionIcon`, written inline twice: `workspace/OverviewTab.tsx:53-68`, `stage/StageGradingPanel.tsx:153-161`. `useClipboard` is also used in `StageGradingPanel`. No shared wrapper. |
| Status chip | Inline `Badge` plus `getStageBadgeProps`/`getPaymentBadgeProps` helpers (see §2). No component. |
| Switch wrapper | None found in the dashboard routes. |
| Empty state | `app/dashboard/_components/DashboardEmptyState.tsx` is dashboard-specific, with its own modal. No generic one in `components/ui`. |
| Skeleton | `components/ui/LoadingSkeleton.tsx`, 76 lines, variants `card|table-row|text-block|avatar`. Wallet and sessions use raw `Skeleton` with `radius="sm"`. |
| PageHeader / breadcrumb | None. Wallet page is 59 lines; settings has `SettingsLayout.tsx` + `SettingsSidebar.tsx`. |
| Modals | Raw Mantine: `WalletTopupModal.tsx`, `DeleteAccountModal.tsx`, `StudentDocumentUploadModal.tsx`, `ExternalFeedbackUploadModal.tsx`, `CreditQuantityModal.tsx`. No shared wrapper. |
| Other `components/ui` | `BuyButton`, `DemoDataFAB`, `FileTypeIcon`, `LoadingScreen`, `Logo`, `RainbowBuyButton`, `ThemeToggler`. |

**`formatPrice`** (`lib/pricing.ts:55-59`):
- Returns `"Miễn phí"` for 0.
- Otherwise it formats with `Intl.NumberFormat("en-US")` and appends ` VND`, giving `79,000 VND`. This matches the AGENTS currency rule.
- It does not help wallet balance. `WalletBalanceCard.tsx:36` uses `toLocaleString("vi-VN")`, which yields a `.` separator and violates the rule.
- `toLocaleString("vi-VN")` also appears in other files, including `dashboard/payment/page.tsx` and `credit-history.types.ts`.

**Dashboard shell** (`DashboardShell.tsx`, 79 lines):
- Top nav is `h-16` sticky (`:47`), with an inner `<nav>` for "Bài viết".
- The 56px topbar and sidebar in the mockup have no direct equivalent.
- The case workspace sidebar is `JourneySidebar.module.css` / `DoubleNavbar.module.css` (height 64px at ≥ breakpoint, `:138`).

### 4. Overlap with the landing-redesign plan
- **`globals.css`:**
  - The plan's Phase 1 edits (`:46-48,183,188`) are already merged. The Phase 4 check "dashboard/admin unchanged except font" still applies.
  - Any new `--t-*`/radius tokens here must not collide with `--lp-*`. They are different namespaces, so no clash.
- **`providers.tsx`:** the plan says "không đổi theme toàn app", and the Alert default is already in. Adding `defaultRadius` or Tabs defaults would contradict that written decision. This is the one real conflict.
- **Case Overview:**
  - Plan Phase 3 touches `overview/*` and `workspace/OverviewTab.tsx`, and that work is already done.
  - A case-detail redesign will edit the same `OverviewTab.tsx:81` and `OverviewIdeaGuideAlert.tsx`.
  - The plan's constraint "không trùng `ContactNextStepCard`/`OverviewHero`; hiển thị đúng thứ tự" must be preserved.
- **Layout/shell:** the plan does not touch `DashboardShell`/`AppShell`.
- **Recommendation:**
  - The redesign should not be blocked by the landing plan. Phases 1 and 3 are already in git.
  - The remaining landing Phase 2 does not touch dashboard files. Mark the landing plan `blocks: []` and `blockedBy: []`, or note the redesign as independent.
  - If the redesign wants `defaultRadius`/Tabs in the theme, put that change in a shared prerequisite phase before it. Landing is self-contained in CSS modules, so it is unaffected, though its Phase 4 "không đổi gì ngoài font" check needs a before/after screenshot.
  - Frontmatter status (`pending`) is stale relative to the commits.

### 5. Tailwind `shadow-*` on Mantine Card/Paper in the 3 areas
- **Not on Card or Paper.** None of these hits is a Mantine Card or Paper. They are on custom divs, Buttons, or spans:

| File | Line | Element |
|---|---|---|
| `case/[id]/_components/WorkspaceTabs.tsx` | 48 | div `shadow-sm` |
| `case/[id]/_components/RoundCard.tsx` | 114 | Button `shadow-sm` |
| `case/[id]/_components/TabReportFindings.tsx` | 149 | Button `shadow-sm` |
| `case/[id]/_components/CaseStatusHeader.tsx` | 152 | span `shadow-xs` |
| `case/[id]/_components/ActivityTimeline.tsx` | 46 | marker `shadow-sm` |
| `case/[id]/_components/WorkspaceSidebar.tsx` | 158 | toggle `shadow-md` |
| `case/[id]/_components/workspace/JourneyWorkspaceShell.tsx` | 101 | FAB `shadow-md` |
| `ExternalFeedbackUploadModal.tsx` | 275, 299 | `shadow-xs` |
| `StudentDocumentUploadModal.tsx` | 145, 169 | `shadow-xs` |
| `TabDiscussionChat.tsx` | 246 | avatar `shadow-xs` |

- **Other prop hits:** `components/layout/NotificationBell.tsx:27` (`Menu shadow="md"`), `_components/UserMenu.tsx:92` (`shadow="md"`), `DesktopOnlyNotice.tsx:48` (`shadow-lg`).
- **None in wallet, `settings/profile`, or `profile`.** `dashboard/profile/page.tsx` is only a redirect alias.
- **Outside the 3 areas:** `intake/*` and `team-fit/NavigationButtons.tsx` also match, but they are not in scope.

### 6. Test infra and verification path
- `package.json` scripts: `dev` (port 3001), `build`, `lint` (`eslint --max-warnings 0`), `check-types` (`next typegen && tsc --noEmit`).
- No `vitest.config*`, `playwright.config*`, `*.test.ts(x)`, or `*.spec.ts(x)` exists under `apps/web-1` outside `node_modules`. There is no test runner.
- **Verification path:** `check-types` + `lint` (zero warnings) + manual browser check. The landing plan Phase 4 uses the same, at 1440/768/390.
- **Wording docs:** `design-system/wording/AGENTS.md` is the index (it defines the per-page layout). There is also `ux-context.md` and `260921-report-fix-ux-wording.md`.
- **Page audit files matching the 3 areas** (all under `design-system/wording/pages/`):
  - Case detail: `case-detail.md`, `case-payment.md`, `supporter-case-detail.md`
  - Wallet: `wallet.md`, `payments.md` (alias), `payment.md`
  - Profile: `settings-profile.md`, `profile.md` (alias), `settings.md`
  - Related settings: `settings-password.md`, `settings-sessions.md`, `settings-notifications.md`
- Mockup docs exist as `design-system/mockups/{case-detail,settings-profile,wallet}/REPORT.md` (163/87/87 lines). Mockup CSS is `css/base.css` + `css/views.css`.

## GAPS & RISKS

| # | Severity | Gap | Decision needed |
|---|---|---|---|
| 1 | high | `--app-text-xs/sm` are both 16px at ≥640px. The mockup's 14px note and 16px body cannot be expressed with Mantine `size` or Tailwind `text-xs/sm`. The uncommitted `--app-text-meta` (15px) is not 14px. | Change the globals (affects all dashboard and admin), or add new `--t-note` etc. scoped to the redesigned pages? |
| 2 | high | The landing plan says "không đổi theme toàn app", but the mockup's radius 8 and Tabs/Badge defaults imply a theme change. | Allow `defaultRadius`/component defaults in `providers.tsx`, or scope to a CSS module / `classNames`? |
| 3 | med | Headings are forced to 600 (`globals.css:188-191`). The mockup uses weight 400/500 only. | Override per page, or change globally? |
| 4 | med | The mockup topbar is 56px; the real one is 64px (`DashboardShell.tsx:47`) and also affects workspace sidebar offsets. | Keep 64px? |
| 5 | med | `WalletBalanceCard.tsx:36` formats with `toLocaleString("vi-VN")`, giving `.` separators, which breaks the currency rule. `formatPrice` returns "Miễn phí" for 0, which may be wrong for a balance. | Use `formatPrice`, or add a separate balance formatter? |
| 6 | med | The mockup uses Phosphor icons inline, but the repo rule is Lucide. | Map icons to Lucide at implementation. |
| 7 | med | Case workspace tabs are a custom component (`WorkspaceTabs.tsx`), not Mantine Tabs. Wallet and stage tabs are `pills`. "Tabs variant A" means migrating three different implementations. | Standardize on Mantine `Tabs` with an underline class? |
| 8 | low | `--field` (#94a3b8) and chip text colors (#1e40af/#065f46/#92400e) have no token. | Accept Mantine `light` Badge colors instead? |
| 9 | low | The landing plan frontmatter is `pending` although Phases 1 and 3 are already merged. | Update the plan status. |
| 10 | low | The `.mantine-Paper-root` `!important` border override (`globals.css:196-216`) will fight any Paper with a custom border in the mockup. | Use a higher-specificity class or `!important`. |
| 11 | low | `WalletProofTable.tsx` is 371 lines, over the ≤200-line rule. `WalletTransactionTable.tsx` is 166. | Split during redesign. |

## REUSE
- **Mantine:**
  - `Tabs`, `Badge variant="light"`, `CopyButton`, `Collapse`, `Accordion`, `Alert` (default Info icon already set), `Skeleton`, `Paper`, `Modal`.
  - Hooks: `useClipboard`, `useDisclosure`, `useMediaQuery`.
- **Shared components:**
  - `components/ui/LoadingSkeleton` (`card`, `text-block`, `table-row`, `avatar`)
  - `components/ui/FileTypeIcon`
  - `ThemeToggler`, `Logo`
  - `NotificationBell`, `_components/UserMenu`
  - `app/dashboard/_components/CaseCard.tsx` (Badge + `getStageBadgeProps` helpers)
  - `app/dashboard/settings/_components/SettingsLayout.tsx` and `SettingsSidebar.tsx`
- **Patterns to copy:**
  - Existing CSS modules (`JourneySidebar.module.css`, `GuidedTemplateCard.module.css`)
  - `ACCORDION_CLASSES` in `TeamFitReportParts.tsx`
  - The inline `CopyButton` + `Tooltip` in `OverviewTab.tsx:53-68`
- **Utilities:**
  - `lib/pricing.ts` `formatPrice` (`79,000 VND`)
  - `lib/deposit-display.ts` (`WALLET_COPY`, `getDepositDisplay`) for wallet copy
- **CSS vars and Tailwind classes:**
  - Vars: `--color-bg/surface/surface-soft/border/border-strong/text/text-muted/text-subtle/brand*/success*/warning*/danger*`
  - Classes: `bg-bg-app`, `bg-surface-app`, `border-border-app`, `text-text-muted`, `bg-brand-soft`
- **Tooling:** `postcss-preset-mantine` is already wired, so `@mixin`, `light-dark()` and `rem()` work in CSS modules.

Skipped: I did not locate where `getStageBadgeProps`/`getPaymentBadgeProps` are defined, or open `StageDetail`/`WalletProofTable` internals. Main risks are gaps 1 and 2, which need a decision before any redesign code lands.