# Case workspace audit (read-only, no files edited)

Evidence is `file:line` from reads and greps. Anything I did not run is marked [UNVERIFIED]. Paths are under `apps/web-1/app/dashboard/case/[id]/` unless stated.

## 1. Inventory

`.env`, `apps/web-1/.env`, `.env.example` and the Dockerfile all set `NEXT_PUBLIC_JOURNEY_WORKSPACE=true`. With that flag, `page.tsx:117-128` returns `JourneyWorkspaceShell` (183 lines). Everything after line 128 (the old 8-tab layout) is dead while the flag is on.

**Live path**

| File | Lines |
|---|---|
| `page.tsx` | **347** (only ~130 are live) |
| `workspace/JourneyWorkspaceShell.tsx` | 183 |
| `workspace/OverviewTab.tsx` | 103 |
| `workspace/JourneyTab.tsx` | 78 |
| `workspace/StageCard.tsx` | 155 |
| `workspace/JourneySidebar.tsx` | 65 |
| `workspace/JourneySidebar.module.css` | 153 |
| `workspace/JourneyMobileNav.tsx` | 52 |
| `workspace/OverviewHero.tsx` | 33 |
| `workspace/OverviewProgressStrip.tsx` | 96 |
| `workspace/OverviewRecentReports.tsx` | 85 |
| `workspace/ContactNextStepCard.tsx` | 29 |
| `workspace/ZaloSupportCard.tsx` | 36 |
| `workspace/stage/StageDetail.tsx` | 171 |
| `workspace/stage/StageHeader.tsx` | 81 |
| `workspace/stage/StageDraftView.tsx` | 24 |
| `workspace/stage/StageFilesView.tsx` | 195 |
| `workspace/stage/StageResultsView.tsx` | 81 |
| `workspace/stage/StageGradingPanel.tsx` | **231** |
| `workspace/stage/AuditConfirmModal.tsx` | **284** |
| `workspace/stage/StageDocumentUploadModal.tsx` | **224** |
| `guided-documents/GuidedDocumentsEditor.tsx` | **236** |
| `guided-documents/GuidedTOC.tsx` | 148 |
| `guided-documents/GuidedQuestionCard.tsx` | 128 |
| `billing/BillingTab.tsx` | 53 |
| `billing/StageBalanceTable.tsx` | 144 |
| `billing/ServiceCheckoutModal.tsx` | 196 |
| `CreditTransactionHistory.tsx` | **418** |
| `credit-history.types.ts` | 189 |
| `TabCaseSettings.tsx` | 198 |
| `CaseContactFields.tsx` | 44 |
| `CaseDeleteSection.tsx` | 125 |
| `ActivityTimeline.tsx` | 79 |
| `TabReportFindings.tsx` | 198 |
| `RoundCard.tsx` | 188 |
| `CaseOverviewPanel.tsx` | **229** |
| `overview/OverviewIdeaGuideAlert.tsx` | 28 |
| `components/ui/FileTypeIcon.tsx` | 40 |

**Hooks (all under `hooks/`)**

| Hook | Lines |
|---|---|
| `useCaseDetails` | 138 |
| `useGuidedDocuments` | 181 |
| `useCaseAiStatus` | 46 |
| `useStageSummaries` | 35 |
| `useTriggerAudit` | 126 |
| `useNextActions` | 72 |
| `useGuidedDrafts` | 73 |

**Dead while the flag is on**
- `StatusGuidanceCard` is **765** lines.
- `TabDiscussionChat` is **433** lines.
- `CaseStatusHeader` is 211, `CreditQuantityModal` is 214, `StudentDocumentUploadModal` is 224, `ExternalFeedbackUploadModal` is 353.
- Also unused: `WorkspaceSidebar`, `WorkspaceTabs`, `CreditPanel`, `CreditActions`, `CreditBalanceCard`, `UnpaidAlertBanner`, `TabIdeaContent`, and the `documents/*` files except those `StageFilesView` imports.
- `workspace/NextActions.tsx` (46 lines) has **no importer**.

## 2. Per tab and stage detail: what to preserve

**Routing.** All state is in the URL, read in `JourneyWorkspaceShell.tsx:37-80`.
- `tab` accepts the legacy aliases `guided`, `journey`, `credits`, `billing`, `timeline`, `settings`, and anything else falls back to overview.
- `stage` and `view` (draft|files|results) are used when `tab=journey`. `view` is cast without validation.
- Every change uses `router.push`, so Back/Forward work, as the mockup's report also expects.
- Pitfall: `handleTabChange` drops `stage` and `view`, so switching tabs and back resets the stage.
- The Zalo link and sidebar footer (`JourneySidebar.tsx:51-62`) must stay.

**Overview** (`OverviewTab`)
- It uses Mantine `Badge`, `CopyButton` and `Tooltip`.
- The order is `ContactNextStepCard`, then `OverviewHero` only if the contact is complete, then `OverviewIdeaGuideAlert` (hidden when the next action is the CP1 draft), `OverviewProgressStrip`, `OverviewRecentReports` (limit 3, by `submitted_at`), `CaseOverviewPanel`, `ZaloSupportCard`.
- Logic to keep: `isCaseContactComplete` gating, and `slugForReport` mapping a report to a stage through `checkpoint_id`.

**Journey list**
- `JourneyTab` has a `Select` filter (all, working, done, coming_soon) and a `SimpleGrid` of `StageCard`.
- `STATUS_META` is defined in `StageCard.tsx:24-36`. Per the mockup report §11, it keeps blue and orange but drops cyan, adds red for error, and moves from `variant="filled"` to `light`.
- The CTA label is derived per status.
- A stage with `available=false` renders a disabled "Chưa mở" button.
- `STATUS_LABEL` is duplicated in `OverviewProgressStrip.tsx:33-39`. This is two sources of truth to merge.

**Stage detail** (`StageDetail.tsx`)
- Gating: when `creditsRemaining > 0` it opens `AuditConfirmModal`, otherwise `ServiceCheckoutModal`. After a purchase it opens the confirm modal (`onPurchased`).
- The audit button is disabled while the status is `grading`.
- Tabs are `variant="pills"` with Lucide icons (`:102-113`). The mockup wants plain tabs with a 3px bottom bar and no icons.
- `StageGradingPanel` renders above the tabs, so it shows on every tab.
- `generateDocx` and `isGenerating` are destructured at `:55` and never used.

**GuidedTOC** uses raw `<button>` and Tailwind, no Mantine.
- It uses `useMediaQuery("(max-width:767px)")` plus an override state for collapse.
- Lock icon comes from `isQuestionUnlocked`, and the thin-answer warning icon (`CircleAlert`) from `isThinAnswer`.
- Critical question ids come from `CP2_SELF_CHECK_BY_QUESTION`.
- Unlock order, in `useGuidedDocuments.ts:129-162`: the question's own `unlock_requires`, then the phase's for the first question, then the previous `required` question.

**GuidedQuestionCard** uses Mantine `Textarea` (`minRows=8`, `autosize`, `maxRows=16`) and `Button`.
- It shows the thin warning "Câu trả lời còn ngắn (N/10 từ)…".
- The Save button is disabled unless `isDirty`.
- Drafts live in sessionStorage, key `nexus_guided_drafts:<caseId>` (`useGuidedDrafts`). They survive a tab switch and reload.
- The editor has a leave-with-unsaved-drafts modal ("Lưu và quay về" / "Bỏ thay đổi"), which `StageDetail`'s `hideBackButton` path never triggers.

**StageDocumentUploadModal**
- Uses Mantine `Modal`, `Dropzone` and `Select`. Limits are max 5 files and 25 MB; accepted types are pdf, docx, xlsx, pptx, txt.
- Per-file `Select` for `category`; Save is enabled only when every file has a type.
- Error strings are kept verbatim.
- Violations: it imports `apiClient` directly (`:11`, `:109`) and has `try/catch` in the component (`:104-138`).

**AuditConfirmModal** has two steps.
- CP1 gets step 1 plus the cost line only.
- CP2 gets an `Accordion` with 4 items: source (both/answers/files), scope (full/questionnaire), kind (initial/resubmit plus `changeSummary`, max 5000), and note (max 2000).
- `sourceReady` / `answersReadyFor` use the server's `answers_ready_full` and `answers_ready_questionnaire` flags.
- Questionnaire forces `initial`.
- It shows a red alert when there is nothing to grade, and a yellow alert when `missingMandatoryCount > 0`.
- That count is never passed by `StageDetail`, so it is always 0.

**StageGradingPanel**
- Polling in `useCaseAiStatus`: 5 s while queued or running, otherwise none.
- Uses `Stepper`, `Progress`, `Collapse`, `CopyButton`, `Tooltip`.
- Renders only when active, failed, cancelled, or completed-and-watched, using the `seenActive` and `dismissed` states.
- On completion it invalidates `["case", id]`.
- "Chạy lại" reuses the previous `scope`, `inputSource`, `userNote` and `changeSummary`.
- "Báo lỗi qua Zalo" copies a report to the clipboard, then opens `ZALO_GROUP_URL`.
- `RadarLogsViewer` with `filterCleanLogs` shows the log lines.
- The Stepper goes vertical under 48em, which is already what the mockup asks for.

**Results**
- `StageResultsView` filters rounds by `checkpoint_id`, with a fallback by report type.
- `TabReportFindings` renders `RoundCard` accordions (the first one open).
  - Each card holds an `iframe` with `LoadingOverlay`.
  - It also has a "Mở xem toàn màn hình" link and a download through `useDownloadReportPdfById`.
  - The PDF URL is `round.pdfUrl` (`/api/reports/:id/download?view=inline`).
- Mockup layout (list left, PDF right) is a rebuild of this part.
- The empty state keeps the "3 bước" guidance.

**Files** (`StageFilesView`)
- Keep: the privacy `Alert` for CP2, the delete-confirm `Modal`, and the 403/message extraction in `onError`.
- The mockup drops two features: the external-feedback tab (`DocumentWorkspaceHeader`) and the student/supporter role filter.

**Billing**
- `StageBalanceTable` shows all 4 stages. `canBuy = available && packages.length > 0`.
- `ServiceCheckoutModal`:
  - `walletBalance` and shortage logic: if the wallet is short it calls `startShortageDeposit` (deposit redirect) with `Math.max(shortage, 2000)`.
  - Quantity is clamped 1..50, and a discount code is supported.
  - Price is shown per member, divided by `MAX_TEAM_MEMBERS`.
  - It has `catch {}` at `:87`, which is a swallow in a component.
- `usePlaceServiceOrder` reuses an idempotency key per session.

**Timeline** (`ActivityTimeline`)
- Excludes `message_sent` events and sorts ascending (oldest first).
- The API sends only the **latest 50** events (`case.repository.ts:85-93`), so the UI shows only the newest 50 and orders them oldest first. The mockup's grouping by day and filtering by type are new.

**Settings** (`TabCaseSettings`)
- Required fields: `team_name`, `school`, `course_context` (messages at `:56-58`), plus contact validation via `validateCaseContact(contact, true)`.
- A red toast and field errors on failure; a green toast on success; the error message is extracted from `err.response.data`.
- `showContactHint` shows when `tab=settings` and the contact is incomplete.
- Save is `disabled={isUpdatingSettings}` only. The mockup's "enabled only after an edit" is new behaviour.
- `CaseDeleteSection` renders only when `stage === "submitted"` and needs the exact text `DELETE` typed in a Modal. The mockup keeps this as a non-functional box.

## 3. Credit / transaction history: can the mockup's expanded row be built?

**What is exposed today**
- `credit_ledger` comes from `getCreditLedgerByCaseId` (`credit-ledger.repository.ts:64-80`). It selects `id, amount, balance_after, type, reference_type, reference_id, created_at` and `service_type.code` as `service_type_code`.
- The web `CreditEntry` type (`credit-history.types.ts:3-11`) omits `reference_type`, so it is dropped on the web side.
- **`orders` is never returned by the case-detail API.** `toBaseResponse` (`get-case-detail.usecase.ts:62-95`) has no `orders`. `caseData.orders` is therefore always `undefined`, and the "Đơn mua" rows never appear. The only order endpoints are `GET /orders` (id, total, status, `service_types`, date) and `GET /orders/:id` (items, `wallet_transaction_id`, `metadata_json`).

| Mockup field | Available now? |
|---|---|
| Time (to the second), type, amount, **balance-after**, status | Yes (`created_at`, `type`, `amount`, `balance_after`). The UI shows time only to the minute. |
| Stage and service | Yes, via `service_type_code`. Show the Vietnamese stage name, not `cp1_audit`. |
| **Ledger row id (tx id)** | Yes (`id`). |
| Reference code for a purchase | Yes: `reference_type="order"`, `reference_id=<order id>` (`order-in-tx.ts:127-129`). `reference_type` needs to be added to the web type. |
| Reference for use or refund | **Partial.** Both set `reference_id = caseId` and `reference_type = null` (`audit-credit.ts:26,44`). So the mockup's "mã lần chấm" and "mã lần chấm bị lỗi" do not exist. |
| Refund reason | In DB `metadata_json.reason`, but not selected by the API. |
| "Lần chấm" link between a use and its refund | Missing. No job id and no pairing. Pairing would have to be by `service_type_code` plus time. |
| Order table (qty, unit price, line amount, total) | Not in the case payload. `GET /orders/:id` has it. Note `OrderItem.service_type` is a code and `unit_price` is the price per pack. |
| Order status | Same: via `GET /orders/:id`. |
| **Payment / bank block** (VietQR, transfer content, bank txn id, credited-at, verification) | **Does not exist for a purchase.** `Order` has no bank fields (`prisma/schema.prisma:276-296`). A purchase debits the wallet (`order-in-tx.ts:97-100`). Bank data lives on `Deposit` (`transfer_content`, `bank_transaction_id`, `bank_credited_at`, `verification_source`), which is a top-up for a user. It has no `order_id` or `case_id`. |

**Backend changes needed**
- In `getCreditLedgerByCaseId` (`cases` module), select `metadata_json` (or `reason`, `quantity`, `unit_price`) and pass `reference_type` through to the web type.
- Add `orders` to the case-detail response, or batch-fetch orders by id from the ledger. There is no `case_id` column; the link is `OrderItem.metadata_json.case_id` (`order-prepare.ts:42`).
- Store the audit job id on consume and refund rows, or add a column, if "Lần chấm" is required.
- The bank block cannot be built per order. The options are to show the wallet transaction (`GET /wallet/history`) or to drop the block. **Needs a product decision.**

## 4. Overview pieces the mockup did not build

All four exist and are live except `NextActions`.

| Component | Behaviour to keep |
|---|---|
| `NextActions` | Not imported anywhere. Shows a `Badge` with `{act.stageCode}`, which would print "CP1" in the UI. |
| `OverviewHero` | Shown only when the contact is complete. One action from `buildNextActions`. The caption uses `tt="uppercase"`, which the mockup bans. |
| `OverviewIdeaGuideAlert` | A 3-step Alert, hidden when the next action is the CP1 draft. |
| `OverviewProgressStrip` | 4 rows with per-stage status and "Đã trả lời N câu, nộp M tài liệu". |

`useNextActions.ts` has `buildNextActions` (priority 1 grading, 2 result, 3 continue, 4 start CP1; max 3).

## 5. CP and currency violations (grep results)

**CP strings shown in the UI**
- `workspace/NextActions.tsx:29` renders the stage code. It is unused today, but the first import would show it.
- Other `CP1`/`CP2` hits are code identifiers or comments, e.g. `TabReportFindings.tsx:84-85` (the labels are Vietnamese: "Vòng Ý tưởng", "Vòng Thị trường") and the `GuidedTemplateGallery.tsx:20` comment.
- Catalog text shown in `GuidedQuestionCard` contains "CP2" or "CP3" in `questions-cp3.ts` (the line at "đã phân tích ở CP2") and `questions-cp4.ts` ("so với CP3", "đã làm ở CP3"). CP3 and CP4 are `available:false` today, so users do not see it yet. It becomes a violation when those stages open.
- Mockup: `billing.js` shows service codes such as `cp1_audit` in a visible `<code>`. Do not copy this.

**Currency**
- `credit-history.types.ts:52-53` and `CreditBalanceCard.tsx:72` use `toLocaleString("vi-VN")`, which gives `79.000`. This breaks the comma rule.
- `ServiceCheckoutModal.tsx:23` uses `en-US`, which is correct (`79,000 VND`).
- No `đ` or `₫` hits in these files.

**Other AGENTS.md violations**
- `StageDocumentUploadModal.tsx` calls `apiClient` directly (`:109`) and has `try/catch` in the component. The hook `useStageDocumentUpload` already exists.
- `ServiceCheckoutModal.tsx:87` has an empty `catch`.
- `ProjectProfileForm.tsx:74` calls `apiClient` directly.
- Over the 200-line limit (including the dead list in section 1): `page.tsx` 347, `CreditTransactionHistory` 418, `AuditConfirmModal` 284, `GuidedDocumentsEditor` 236, `StageGradingPanel` 231, `StageDocumentUploadModal` 224, `CaseOverviewPanel` 229, `ProjectProfileForm` 220.
- `GuidedTOC` and `GuidedQuestionCard` use raw HTML and Tailwind, not Mantine.

## GAPS & RISKS

| # | Sev | Gap | Decision |
|---|---|---|---|
| 1 | **blocker** | Payment/bank block cannot be built per order (no link between order and deposit). | Drop it, or show wallet transaction instead? |
| 2 | **blocker** | `orders` is not in the case payload, so purchase rows and the order table are missing even in today's UI. | Extend the case API, or fetch via `GET /orders/:id`? |
| 3 | high | "Lần chấm" and failed-run codes do not exist (use and refund both reference `caseId`). | Add a job reference on the ledger? |
| 4 | high | The live journey path drops all of: discussion chat, `StatusGuidanceCard`, intake redirects (`T2/T16` transitions), `confirmComplete`, `?checkout=true` auto-open, owner/transition filtering, AI-package gating. None are in the mockup either. | Delete them, or port? Note `useRealtimeChat` and `useCaseUnreadCount` still run on every case page (`page.tsx:76-77`). |
| 5 | high | "Đồng bộ thông tin" and "Xuất DOCX" move to a `⋯` menu in the header. Drafts are a per-instance `useState` (`useGuidedDrafts`), so the header cannot pass `Object.keys(drafts)` to `syncAnswers`. | Lift the draft state or put the menu inside the editor? |
| 6 | high | Mockup "Cần nêu" and "Ví dụ" hint groups: the catalog has only `explanation` (free prose), `suggested_actions`, `further_reading`. | Parse the prose, add catalog fields, or show only the three real parts? |
| 7 | med | `missingMandatoryCount` is never passed, so the "Còn câu điều kiện chưa điền" warning never shows. | Keep or drop? |
| 8 | med | The mockup moves the Save-disabled state, grading panel, and tabs to a new look, but the leave-with-unsaved-drafts modal only exists on the editor's own back button. | Keep for stage back? |
| 9 | med | Timeline: only the newest 50 events are sent; grouping and filtering would silently hide older ones. Order flips (oldest first today). | Raise the API limit, or label it? |
| 10 | med | Results: replacing `RoundCard` accordions with a list plus one iframe removes the mobile layout (the iframe is hidden below `sm` today) and the per-card download. | Mobile fallback for the PDF? |
| 11 | med | The mockup bans uppercase, 600/700 weights and text under 14px; 29 `text-xs` occurrences sit in the workspace folders, and `--app-text-xs` is 16px. | Token change vs per-component fix? |
| 12 | med | The settings mockup is "locked" but changes Save to edit-only enable, and the mockup shows the delete box for all states. | Keep `stage === "submitted"`? |
| 13 | med | Overview mockup drops: team members section (`OverviewMembersSection`), team-fit gaps and verdict (`OverviewGapsSection`), the support section, the support needs, and the Zalo card. | Hide behind the collapsible, or remove? |
| 14 | low | Real sidebar is sticky at `top:64px`, brand-blue background (`JourneySidebar.module.css`); mockup uses 56px. Mobile open button is a custom `<button>`, not Mantine. | Match 64px. |
| 15 | low | Copy: history labels use "credit" ("Nạp credit", "Trừ credit", "Hoàn credit") and "lượt đánh giá case"; the mockup uses "lượt chấm". `STATUS_LABEL` is duplicated. | Align with `design-system/wording/`. |
| 16 | low | Radar logs: the mockup shows only the stepper. `RadarLogsViewer` is not drawn in it. | Keep? |
| 17 | low | `copyReport` in the grading panel copies the case UUID, not `case_code`. | Switch to `case_code`? |

**Not in the mockup but live today:** realtime chat and unread badge, the contact form fields beyond the mockup's six (they match), Telegram, radar logs, external-feedback documents, the supporter filter, and the DELETE flow.

## REUSE

- **Mantine:** `Tabs` (gives `role`, `aria-selected`, keyboard for free), `Badge variant="light"`, `Paper withBorder radius="md"`, `Accordion`, `Collapse`, `Stepper`, `Progress`, `Modal`, `Drawer`, `Dropzone`, `CopyButton`, `Tooltip`, `Select`, `SegmentedControl`, `NumberInput`, `TextInput`, `Textarea`, `Alert`, `UnstyledButton`.
- **Hooks:** `useCaseDetails` (with `contact`, `updateSettings`, `deleteCase`), `useStageSummaries`, `useCaseAiStatus`, `useTriggerAudit`, `useGuidedDocuments` (`isQuestionUnlocked`, `generateDocx`, `syncAnswers`), `useGuidedDrafts`, `useStageDocumentUpload`, `useStageDocumentDelete`, `useDownloadReportPdfById`, `useServiceCatalog`, `useWalletBalance`, `usePlaceServiceOrder`, `useShortageDepositRedirect`.
- **Helpers:** `buildNextActions`, `isThinAnswer`, `countWords`, `THIN_ANSWER_WORDS` (10), `CP2_SELF_CHECK_BY_QUESTION`, `transformToUnifiedItems`, `formatDateTime`, `formatDateShort`, `getReportPdfFilename`, `isCaseContactComplete`, `validateCaseContact`, `findStageBySlug`, `STAGES`, `STAGE_DISPLAY_META`, `ZALO_GROUP_URL`.
- **Shared UI:** `FileTypeIcon` (PNG from `/public`, extension map), `BuyButton`, `LoadingSkeleton`, `BillingTableShell`.
- **CSS vars** (per the mockup report): `--color-bg`, `--color-surface`, `--color-surface-soft`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-brand`, `--color-brand-subtle`, `--color-success-soft`, `--color-warning-soft`, `--color-danger-soft`.

**Not checked:** CSS of `GuidedTemplateCard.module.css`, the `documents/*` table internals, `GuidedImportModal`, `useDownloadReportPdf`, and whether `design-system/wording/` contains the history copy. I did not run the app, so nothing here was observed in the browser.