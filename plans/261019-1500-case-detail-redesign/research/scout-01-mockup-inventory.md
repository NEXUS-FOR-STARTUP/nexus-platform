# Mockup `case-detail` — extraction

Source: `design-system/mockups/case-detail/`. Line counts:

| File | Lines |
|---|---|
| `index.html` | 61 |
| `css/base.css` | 129 |
| `css/views.css` | 224 |
| `js/app.js` | 44 |
| `js/views/overview.js` | 57 |
| `js/views/journey.js` | 57 |
| `js/views/stage-draft.js` | 91 |
| `js/views/stage-files.js` | 13 |
| `js/views/stage-results.js` | 37 |
| `js/views/billing.js` | 65 |
| `js/views/timeline.js` | 21 |
| `js/views/settings.js` | 63 |
| `js/views/spec.js` | 27 |
| `js/views/audit.js` | 87 |
| `js/views/upload.js` | 50 |
| `js/views/grading.js` | 46 |
| `js/data/history.js` | 65 |
| `js/data/stage.js` | 15 |
| `js/data/stages.js` | 19 |
| `js/data/states.js` | 15 |
| `js/data/unlocks.js` | 177 |
| `js/data/questions-cp1.js` | 272 |
| `js/data/questions-cp2.js` | 350 |

I read every file except `icons.js` and the bulk of the catalog data, and did not render the page in a browser. Tags are N = new behaviour or data the product may not have, V = purely visual, M = marked mockup-only.

## Shell and router (`index.html`, `app.js`)

- **Layout:**
  - The grid is a 264px sticky sidebar plus `main`. The main column is `.col` (max 880px), `.narrow` (720px) for timeline and settings, and `.wide` (1320px) for stage detail.
  - The sidebar has 5 nav links plus `spec`.
- **Query contract:** `?tab=overview|journey|billing|timeline|settings` (`spec` is mockup-only). `&stage=y-tuong|thi-truong&view=draft|files|results`. Every navigation is an `<a>` or a `[data-to]` button that rewrites the query. Extra params:
  - `?grading=queued|running|failed|cancelled|completed` (M).
  - `?answers=all` (M).
- **Mobile (≤820px), N:**
  - The sidebar becomes a fixed left drawer (`min(320px,85vw)`) with a scrim, a bottom-left 48px burger FAB and a close button.
  - Focus moves to the close button on open and back to the burger on close.
  - Esc closes it, Tab is trapped inside, and it auto-closes when the viewport widens.
  - It is `visibility:hidden` when closed.
  - The topbar note is hidden, and `main` padding is 24px 16px 88px.
- **Folds:** `details.fold` stays open on desktop. On phones it is closed unless `[data-keep]`, and the summary is hidden on desktop (`views.css:~190`). Used by the TOC, hint panel, run list and timeline days. This is N, a new responsive pattern.
- **A11y:** `nav aria-label`, `aria-expanded` and `aria-controls` on the burger, `:focus-visible` outline, and `prefers-reduced-motion` gates the view-enter animation.

## Per-view specs

### 1. Overview (`overview.js`)

- **Purpose:** project dashboard.
- **Elements:**
  - H1 "Tổng quan dự án", with a subtitle of the team name and a chip button for the case code `NX-894046` (copy).
  - Next-action card: "Việc tiếp theo: điền thông tin liên hệ" with a button to `tab=settings`.
  - "Hành trình" rows (2 stages): name, "Đã trả lời a/b câu · n tài liệu", chip "Đã có kết quả", and button "Xem kết quả" → `journey&stage&view=results`. A note says "Sản phẩm & mô hình và Gọi vốn & tài chính sẽ mở sau."
  - "Báo cáo gần đây": 3 rows, each with a PDF icon, "label (bản NN)", a date, and a "Xem" button → the results view.
  - "Hồ sơ dự án": a collapsed `<details>`. The summary reads "Còn thiếu 6 thông tin · Bổ sung" (link to settings). The body is key-value lists: project name, role, startup idea (5 fields), team (5 members), team risks (3).
- **Data fields:** `CASE_CODE`, per-stage answered/total, doc count, the 3 latest runs (`stage`, `label`, `when`, `n`), and profile fields.
- **Responsive:** `.row` collapses to 2 columns, with the chip on row 2. `.kv` becomes 1 column.
- **A11y:** the copy button has `aria-label`. On copy failure the text becomes "Không sao chép được".
- **N (needs new behaviour or data):**
  - The copy button uses the clipboard API with 1.5s feedback.
  - The next-action line is derived from missing contact fields (rule not defined).
  - "Báo cáo gần đây" is the latest 3 reports across stages, with the comment noting `RECENT_REPORTS_LIMIT` already exists in web-1. The label comes from `report.utils.ts`, and "bản NN" is `version_no + 1`.
  - "Hồ sơ dự án" collapsible with a "missing 6" count. That count is hardcoded, so the missing-field computation is undefined.
- **V:** removing the Zalo card and the "Chưa cập nhật" rows. The mock note at the end says these were dropped.
- **M:** "Báo cáo gần đây là dữ liệu mẫu bịa" (printed note).

### 2. Journey list (`journey.js`)

- **Purpose:** the 4 stages.
- **Elements:**
  - Rows with a name, a note ("desc · a/b câu · n tài liệu · còn N lượt chấm" or "hết lượt chấm"), a chip, and a quiet button "Xem kết quả".
  - 2 locked rows (lock icon, chip "Sắp ra mắt", no button).
  - Unknown or locked `?stage=` shows a mock note ("chưa có trang chi tiết").
- **Data:** stage note is computed from `STAGE_DATA` (answered, total, docs, credits).
- **M:** the notes about "only a secondary button" and "locked stages could merge into 1 row".
- **N:** the list shows per-stage credit counts. The stage "desc" strings are hardcoded copy, so check `design-system/wording/`.

### 3. Stage detail shell (`journey.js` `showStage`)

- **Elements:**
  - Breadcrumb "Hành trình / <name>".
  - H1 plus a status chip appended to the title: "Đang chấm" while busy, "Đã có kết quả" when `runs.length>0`.
  - A `⋯` menu (`details.menu`) with "Đồng bộ thông tin" and "Xuất file DOCX". It is shown only in the draft view.
  - CTA: `credits ? (runs.length ? "Chấm lại" : "Chấm bài") : "Mua lượt chấm"`. It is disabled while queued or running. With no credits it is a `data-to` link to billing, otherwise it opens the audit modal.
  - Grading panel slot.
  - Tabs: "Soạn thảo", "Tài liệu (N)", "Kết quả chấm".
- **A11y:** `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls` and `aria-labelledby`. The menu summary has `aria-label="Thêm"`. Gaps:
  - Tabs have no arrow-key handling.
  - The tabs are `button[data-to]` that reload the page via `location.search`, which fits URL-driven state.
- **Responsive:** `.head` stays flex, so the CTA and menu may wrap.
- **N:** the CTA state logic, which the code comment says mirrors `StageHeader` in web-1. The mock note describes the DOCX menu being scoped to the draft tab.

### 4. Stage draft (`stage-draft.js`)

- **Purpose:** 3-pane Q&A editor: TOC (280px) | answer | hint (360px).
- **Elements:**
  - TOC: phase group headers with "x/y" counts. Rows carry state icons: tick (answered), ring (empty), alert (thin, CP2 only), lock (disabled). The active row is highlighted with a right arrow, and critical questions show a "Quan trọng" badge. Mobile summary reads "Câu N trên M · text · k đã trả lời".
  - Answer pane: H2 question text, meta "Câu N trên M · Bắt buộc/Nên có/Tuỳ chọn", a textarea (placeholder "Nhập câu trả lời của nhóm"), a thin-answer warning (`role=status`, "Câu trả lời còn ngắn (n/10 từ)…"), and a self-check checkbox box for the 3 critical CP2 questions.
  - Footer: status text ("Đã lưu", "Chưa lưu", "Chưa có câu trả lời") and buttons "Câu trước", "Lưu" (enabled after edit), "Câu tiếp" (hidden on desktop via `#next{display:none}`, disabled if the next question is locked).
  - Hint panel (sticky, `top:72px`): lead, "Cần nêu" bullets, "Ví dụ" with "Chưa tốt"/"Tốt" chips, "Tự kiểm tra trước khi lưu" checklist (`actions`), "Đọc thêm" external links, and a "Xem thêm lưu ý" fold.
- **Data:** catalog `id`, `text`, `explanation`, `actions`, `further`, `classification`, `answer`, `UNLOCK` rules, `THIN_WORDS`=10 and `CP2_CRITICAL`.
- **Responsive:**
  - ≤1240px: hint moves under the answer, static.
  - ≤820px: single column. TOC and hint become folds, and selecting a question closes the TOC and focuses the H2 (`tabindex=-1`).
- **A11y:** `aria-current` on the active row, titles on rows, `title` on the thin-warning icon, and a textarea `aria-label`.
- **N:**
  - `parseHint` splits `explanation` by text patterns ("Cần nêu", "Đạt:", "Không đạt:", "Ví dụ Pass:"). The product would need structured hint fields or the same parser.
  - The unlock rules mirror `isQuestionUnlocked`.
  - The thin check is client-side and the server stays authoritative.
  - The critical self-check box saves immediately in the product and is memory-only here.
  - `further` links.
  - The DOCX menu.
- **M:** "Câu trả lời là dữ liệu mẫu bịa", "?answers=all", and the Save button not persisting.

### 5. Stage files (`stage-files.js`)

- **Purpose:** submitted documents.
- **Elements:**
  - Privacy `.alert` ("Lưu ý quyền riêng tư"), CP2 only.
  - H2 "Tài liệu đã nộp (N)", a hint "PDF, DOCX, XLSX, PPTX, TXT · tối đa 5 tệp, mỗi tệp 25 MB", and a "Tải tài liệu lên" button.
  - Empty state card "Chưa có tài liệu nào".
  - Documents grouped by category (`.gh` header then `.rows`). Each row has a file icon, a name, a "Bản 2" chip, meta "TYPE · size · uploader · date", and download and delete icon buttons with `aria-label` "Tải xuống X" / "Xoá X".
  - Footer "Có thể thêm: <categories>".
- **N:**
  - Grouping by category. The 7-column table is replaced by rows.
  - The "Bản N" version chip, which needs a per-document version field.
  - The "Có thể thêm" list of remaining categories.
- **V:** icon-only buttons replacing the table, and 8px rows.
- **Gap:** Delete has no confirm in the mock.
- **M:** "Tệp là dữ liệu mẫu bịa".

### 6. Stage results (`stage-results.js`)

- **Purpose:** a PDF per grading run.
- **Elements:**
  - Left: a run list (300px, max-height 620px, scrolls). Each row shows "Lần N", a "Mới nhất" chip on the first, and a timestamp.
  - Right: a file header with name, "PDF · Chấm lúc …", "Mở toàn màn hình" and "Tải PDF" buttons, plus a paper area with a placeholder page.
  - Empty state: "Chưa có kết quả chấm", an ordered 3 steps, and a "Chấm bài" button.
- **Responsive (≤820px):**
  - Single column.
  - The run list is a fold whose summary reads "Lịch sử chấm · Lần N, when".
  - Picking a run collapses the fold and focuses the summary.
  - List max-height 240px.
- **N:**
  - PDF viewer split. The right pane is an iframe in the product, not in the mockup.
  - A "Mở toàn màn hình" action.
  - Scales to 20+ runs.
  - The comment says "No scores or deltas": the UI shows only file and time, not stored scores.
- **M:** the placeholder PDF text, the sample run list, and the links "Xem trạng thái chưa chấm lần nào" and "Quay lại màn có kết quả".

### 7. Billing (`billing.js`)

- **Purpose:** credits and payment history.
- **Elements:**
  - Two balance cards ("2 lượt", "0 lượt") each with a "Mua thêm" button. A note says "Hai giai đoạn sau chưa mở nên chưa có lượt chấm."
  - Filter segment: Tất cả / Mua / Dùng / Hoàn, each with a count. There is a range select (all / 3 / 7 days) and a count "N giao dịch".
  - Transaction rows are `details.tx`: date, title with stage note, signed amount ("+2 lượt", green for +), a status chip (ok/warn), and a chevron.
  - The expanded panel has:
    - "Giao dịch": time, type, stage, service (label plus code), delta, balance after, status, source, run, transaction ID with copy, ref (order, job or upgrade) with copy.
    - A failed-run alert.
    - "Đơn hàng": order ID, status, an items table (service, quantity, unit price, line total) and a total.
    - "Thanh toán": method, transfer content, bank transaction ID, credited-at, verification.
- **Responsive (≤820px):** the row becomes a 2-line grid. Only the first 5 rows show, with the button "Xem thêm N giao dịch" / "Thu gọn" and the count "Hiện X trên Y giao dịch". Folds reset on resize.
- **A11y:** copy buttons have `aria-label` ("Sao chép …", "Đã sao chép"). Rows are native `details`.
- **N (all new):**
  - Expandable tx rows. The code comment says the product must join `CreditEntry` (`id`, `reference_id`, `balance_after`, `service_type_code`), `Order` and `OrderItem` (`id`, `items`, `unit_price`, `amount`, `total_amount`) and the Deposit bank fields (`transfer_content`, `bank_transaction_id`, `bank_credited_at`, `verification_source`). Those may not all be exposed through the API [UNVERIFIED].
  - Copy buttons.
  - Type and range filters.
  - "Xem thêm N" mobile truncation.
  - The "Mua thêm" and "Mua lượt chấm" buttons have no flow in the mockup.
- **M:** "Dữ liệu mẫu, không phải dữ liệu thật" in the heading. The `uid` function and `hexOf` are fake generators, `PRICE_PER_CREDIT`=50000 is sample, and "Bộ lọc hiện vì có hơn 5 dòng" is a mock note. The filter is always shown, so the note describes a rule the code does not implement.

### 8. Timeline (`timeline.js`)

- **Purpose:** activity log.
- **Elements:**
  - Type filter (Tất cả / Chấm bài / Lượt chấm / Dự án, with counts).
  - Events grouped by day as `details.fold`. The day summary shows a count "N sự kiện". The first (newest) day has `data-keep`, so it stays open on phones.
  - Event: a type icon in a 32px circle on a vertical line, a bold title, a time, a detail, and "Thực hiện bởi …".
- **Responsive:** other days fold on phones.
- **N:** day grouping and a vertical timeline with icons (a UI change). The type filter is client-side. The mock note says this is "like the old UI".
- **M:** "Dữ liệu mẫu, không phải dữ liệu thật".

### 9. Settings (`settings.js`)

- **Purpose:** project and contact info.
- **Elements:**
  - Notice region (`role=status`).
  - Form with a "Thông tin dự án" section (team name\*, group number, school\*, class\*) and a "Người liên hệ" section (full name\*, student code, team role, phone/Zalo\*, email\*, Telegram). A note says it applies to this project only.
  - A "Lưu thay đổi" button, disabled until a field is edited. Submit validates the 6 required fields: per-field `.ferr` messages, `aria-invalid`, `aria-required`, `aria-describedby`, focus on the first invalid field, and a bad/ok notice.
  - A "Xoá dự án" danger card, noted "chỉ hiện khi hồ sơ ở trạng thái đã nộp".
- **Responsive:** `.two` collapses to 1 column.
- **N:** the Save-disabled-until-dirty behaviour, the error-clears-on-input behaviour, and the Telegram and student-code fields (check that real fields exist). The delete button is always rendered in the mockup although it is conditional in the product.
- **M:** "chưa lưu thật", "Nút Lưu chỉ bật khi bạn sửa một ô…", and the delete button being inactive.
- **Gap:** the mockup uses native `<input>`, whereas real code must keep Mantine `TextInput` (error, props, validation).

### 10. Spec (`spec.js`) — M

The whole view is mockup-only: type scale, chips, TOC row legend, tabs, buttons, surfaces. It is not for production.

### 11. Audit modal (`audit.js`, native `<dialog>`)

- **Purpose:** a two-step grading confirmation.
- **Step 1/2, "bạn đang có gì để chấm?":**
  - Two checklist rows: answers count and attached file count.
  - A "Sang tab Tài liệu để tải lên" button if there are no files.
  - A blocking alert if there is nothing to grade (Tiếp tục disabled), or a warning for missing required questions.
  - Buttons "Hủy" and "Tiếp tục".
- **Step 2/2:**
  - CP2 (Thị trường) only: 4 accordion cards (radio groups).
    - "Chấm gì": both / answers / files.
    - "Chấm tới đâu": full / questionnaire.
    - "Lần chấm này": new / re-grade. Re-grade shows a "Bạn đã sửa gì" textarea (max 5000).
    - "Ghi chú thêm" (max 2000).
  - A warning "Chấm khi thiếu tệp".
  - Cost line "Tốn 1 lượt - còn lại N sau lần chấm này".
  - Buttons "Quay lại", "Hủy", "Bắt đầu chấm bài".
  - CP1 (Ý tưởng) goes straight to the cost line.
- **Interactions:** options are disabled by readiness rules. Choosing "questionnaire" forces `kind=initial`. A backdrop click closes it. Accordion open state is preserved across re-renders. "Go" navigates to `…&grading=queued`.
- **A11y:** `aria-labelledby` on the dialog, native focus trap via `showModal`, and radio inputs inside labels.
- **N:** the whole flow. The code comment says it mirrors `AuditConfirmModal`. The mock simplification: "answers ready" is just "at least one answer" [real value comes from a server summary].
- **Gap:** the dialog is custom CSS. Real code must use the Mantine `Modal`, and the AGENTS rule forbids Tailwind positioning on it.
- **Responsive:** width `min(560px, 100vw-32px)`, max-height `100vh-32px`, scrolls.

### 12. Upload modal (`upload.js`, native `<dialog>`)

- **Purpose:** pick files and tag each one.
- **Elements:**
  - A drop zone (label wrapping a visually hidden file input, with focus-within outline).
  - A selected-file list: icon, name, size in MB, a remove button, and a required type select with 5 options ("Bạn mô tả ý tưởng", "Slide thuyết trình", "Nghiên cứu thị trường", "Kế hoạch tài chính", "Tài liệu bổ sung").
  - An error alert (`role=alert`), "Hủy" and "Lưu" (enabled when ≥1 file and all typed).
- **Validation:** max 5 files, max 25 MB each, extensions pdf/docx/xlsx/pptx/txt, with Vietnamese messages. Drag and drop is supported.
- **N:** per-file type tagging ("AI dùng loại này để phân loại"). The limits are called "the product's own".
- **M:** "Nothing is uploaded; Save only confirms", plus the success alert "Đã tải N tài liệu (chưa lưu thật)".
- **Gap:** the 5-file limit is checked only against the files in the dialog. It does not count already-submitted documents.

### 13. Grading panel (`grading.js`)

- **Purpose:** progress bar above the stage tabs, visible on every tab.
- **Elements:**
  - Header: a state chip, a headline, an elapsed time (queued and running only), `#<job id 8 chars>`, and action buttons.
  - Body: a CP2 line "Đang đọc: câu trả lời và tài liệu / đánh giá toàn diện", a failed-state error note, a progress bar, and a step list with 4 steps per stage.
  - A toggle `ib` (`aria-expanded`) collapses the body.
- **States:**

| State | Chip | Actions |
|---|---|---|
| queued | "Hàng đợi" (warn) | toggle |
| running | "Đang chấm" (draft) | toggle |
| completed | "Hoàn tất" (ok) | "Xem kết quả", "Đóng" |
| failed | "Gián đoạn" (err) | "Chạy lại", "Báo lỗi qua Zalo", toggle |
| cancelled | "Đã dừng" (lock) | "Chạy lại", toggle |

- **Responsive:** the step list becomes a column at ≤820px.
- **A11y:** the toggle has `aria-label="Thu gọn"` and `aria-expanded`. The label never switches to "Mở rộng", so the label is wrong once collapsed. There is no `aria-live` on the progress panel.
- **N:** it needs a job poll, an elapsed time, a job ID, and a "Báo lỗi qua Zalo" action (the target link is not defined).
- **M:** `?grading=…` selection, sample job `1a913f8e`, sample elapsed `01:42`, the tooltip "(mock)", and the fixed step counts (`GRADE_DONE`).

## Design tokens (`css/base.css`)

| Group | Token / value |
|---|---|
| Surfaces | `--page #f8fafc`, `--ground`/`--surface #fff`, `--surface-2 #f1f5f9`, `--line #e2e8f0`, `--line-strong #cbd5e1` |
| Text | `--ink #0f172a`, `--muted #475569`, `--field #94a3b8` (also timeline connector and step dots) |
| Brand | `--brand #2563eb`, `--brand-hover #1d4ed8`, `--brand-soft #dbeafe`, `--brand-subtle #eff6ff`, `--brand-ink #fff` |
| Status | ok `#10b981`/soft `#d1fae5`, warn `#f59e0b`/soft `#fef3c7`, err `#ef4444`/soft `#fee2e2` |
| Off-token literals | `#1e40af` (draft chip text), `#065f46` (ok), `#92400e` (warn), `#991b1b` (err), `#a16207` (thin warning), `#ffedd5`/`#c2410c` ("Quan trọng"), `#6d28d9`/`#ede9fe` (hint book icon), `#b45309`, `#047857`, `#fecaca` |
| Type scale | 4 steps: 24 title (500), 18 section (500), 16 body (400/500), 14 note (400, muted). Weights are 400 and 500 only. The font is "Inter Tight". Line-height is 1.5 for body, 1.25 for h1 and 1.3 for h2. |
| Spacing | `--gap-section 48px`. Main padding is 40px 48px 96px on desktop and 24px 16px 88px on mobile. Card padding is 24×28. |
| Radii | 8px (card, button, input, row, nav, details), 6px (menu item, code, badge), 999px (chip, progress bar), 12px (dialog) |
| Chips | 26px high, 12px horizontal padding, 14px/500, pill. Variants: default grey, `draft` (blue), `ok`, `warn`, `lock` (grey), `err` (red, in `views.css`). |
| Buttons | `.btn` is 40px high, 20px padding, 16px/500, brand fill. `.quiet` is white with a `--line-strong` border. Disabled is grey on `--surface-2`. Active scales to .98. `.ib` is a 36px icon button. |
| Tabs (A) | Plain text. Active is ink at weight 500 with a 3px `--brand` bottom bar. Inactive is muted. Gap 28px, horizontal scroll. The same `.tabs` component is used for filters. |
| Shadows | Only on the menu popup, dialogs, the open drawer and the burger. |
| Breakpoints | 820px (mobile), 1240px (hint panel drops below), 821px (desktop-only rules). |

Some radii (menu, code) are off the 8px scale. Heights are 40px for buttons, 36px for `.ib` and 26px for chips, so the "control size ≥ sm" rule needs checking against Mantine's sm size (36px) [UNVERIFIED].

## AGENTS-rule flags

1. **Visible CP1/CP2 text:** `index.html:11` shows "catalog CP1 và CP2 thật" in the topbar. It is mockup chrome, but it is visible text. The other CP1/CP2 mentions are code comments and identifiers (`CP1_PHASES`, `cp2_*` ids, `IS_CP2`), which the UI never prints. The stage names shown are "Ý tưởng" and "Thị trường".
2. **Currency:** `history.js` `fmtVND` uses `n.toLocaleString("vi-VN")`, which yields `50.000 VND` with a dot separator. This violates the rule `79,000 VND`. The suffix position is right. This is the only money formatting in the mockup. No `đ` or `₫` was found.
3. **English and jargon leaks (visible):**
   - "Pass" / "Fail" / "Nếu fail" in the catalog hint text (`questions-cp1.js:232,237`, and the parser at `stage-draft.js:29`).
   - The CP1 question text "Tiêu chí pass và fail của MVP là gì?".
   - Sample data: "EdTech & Peer-to-Peer Learning", "full-stack web", "mentor", "SOM".
   - Terms: "PDF", "Zalo", "Telegram", "VietQR", "Pitch-deck".
   - A file name "MentorMap_Pitch-deck.pptx".
   - The "TAM/SAM/SOM" and "Porter's Five Forces" catalog ids, which are not shown as text (questions not read in full). `questions-cp2.js` is 350 lines and I only grepped it, so other leaks there are [UNVERIFIED].
4. **Icons:** the mockup uses inline Phosphor SVGs (`icons.js`, a note in `spec.js`). Real code must use Lucide.
5. **Dates:** `dd/mm/yyyy hh:mm` is used. I did not check this against the wording canon.
6. **Mantine mismatches:** the dialog, tabs, chips, buttons, inputs, `details` accordions, and the select are all native or custom. Each needs a Mantine equivalent (`Modal`, `Tabs`, `Badge`, `Button`, `TextInput`, `Select`, `Accordion`).
7. **File size:** each view file is small, but the real code for the billing and draft views will likely exceed 200 lines.

## Marked mockup-only (explicitly)

- Topbar note: profile, history and document data is invented. Questions and hints come from the real catalog.
- `spec` view (entire).
- `?grading=` and `?answers=all` query params.
- Overview, billing, timeline and results sample-data notices.
- "Chưa lưu thật" for upload and settings save.
- "(mock)" tooltip on grading failed text.
- Hint panel mock note, files mock note, journey mock notes.
- Fake IDs and bank refs from `uid`/`hexOf`, `PRICE_PER_CREDIT`, `NOW` fixed at 2026-10-12.
- Audit "answers ready = at least one answer" simplification.
- The grading "Chạy lại" and "Báo lỗi qua Zalo" buttons and the Mua thêm buttons do nothing.

Not checked: how the product wires any of these. The only product references are code comments (`StageHeader`, `AuditConfirmModal`, `GuidedTOC`, `TabCaseSettings`, `JourneyMobileNav`, `StageDocumentUploadModal`, `StageGradingPanel`), and I did not verify them against `apps/web-1`.