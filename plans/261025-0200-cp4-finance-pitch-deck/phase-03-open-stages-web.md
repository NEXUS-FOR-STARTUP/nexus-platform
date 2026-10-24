# Phase 3 — Mở stage: stage không chấm trên web

Điều kiện vào: phase 2 xanh. Đây là phase duy nhất làm CP4 và Pitch deck hiện ra với người dùng. Trường hợp mới: stage `available: true` nhưng `serviceType: null`. Cờ dẫn xuất duy nhất: `stage.serviceType !== null` (không thêm trường API; `STAGES` đã là nguồn chung; `StageSummary` không đổi). `AuditCheckpointCode` vẫn chỉ CP1-CP3, nên `AUDIT_STAGE_UI`, `TabReportFindings`, `useOpenCheckpoint` không đổi.

Đường dẫn web tính từ `apps/web-1`; `C=app/dashboard/case/[id]/_components`, `W=$C/workspace`, `S=$W/stage`.

## Việc làm

1. **`packages/shared/src/stages.ts`** — CP4: `slug: "tai-chinh"`, `name: "Tài chính"`, `available: true`; PITCH: `available: true`. Slug cũ `goi-von-tai-chinh` chỉ còn xuất hiện ở `stages.ts` và `$W/stage-descriptions.ts` (đã kiểm), đổi cả hai trong cùng commit (A2).
2. **`$W/stage-descriptions.ts`** — `"tai-chinh": "Doanh thu, giả định P&L, điểm hòa vốn và nguồn vốn"`, `"pitch-deck": "Soạn nội dung bài pitch 10 mục, elevator pitch và chuẩn bị hỏi đáp"`. Bắt buộc có `pitch-deck`, thiếu thì `JourneyTab.tsx:36` ghép chuỗi "undefined".
3. **`$S/StageDetail.tsx`** (đã 204 dòng, giữ thay đổi ngắn) — sau early return: `const graded = stage.serviceType !== null;` và `const activeView = graded ? view : "draft";`. Khi `!graded`: không render `StageStartGuide` (hướng dẫn mua/chấm), `StageGradingPanel`, `FilterTabs`, `AuditConfirmModal`; chỉ render `StageDraftView`. Lý do ẩn tab: `ResultsEmptyState` có nút "Chấm bài" gọi `triggerAudit` không kèm checkpoint (mặc định CP1), có thể chấm nhầm CP1 (rủi ro 1). `StageGradingPanel` bọc trong `stage.serviceType !== null && ...` để TS thu hẹp `stage.code` còn CP1-CP3 và hết lỗi type `:136` (`checkpoint: AuditCheckpointCode`). URL `?view=results|files` vẫn hợp lệ nên dùng `activeView`, không dùng `view`, ở mọi nơi render.
4. **`$S/StageHeader.tsx`** — `const graded = stage.serviceType !== null`. Khi `!graded`: `meta` chỉ còn `x/y câu` (bỏ "tệp" và "lượt chấm"), không chip "Đang chấm/Đã có kết quả", không khối nút "Chấm bài/Mua lượt chấm" (nút "Mua lượt chấm" hiện chỉ gọi `setCheckoutOpen` mà modal không mount: nút chết). `StageActionsMenu` (docx, đồng bộ) giữ nguyên, nó hiện khi `view === "draft"`.
5. **`$W/JourneyTab.tsx`** — `:27` đổi "đến gọi vốn" thành "đến bài pitch" (số giai đoạn tự theo `STAGES.length`); `:34-40` chỉ ghép "tài liệu" và "lượt chấm" khi `stage.serviceType` có. `LOCKED_NOTE` giữ (nhánh `!available` còn hợp lệ cho stage sau này).
6. **`$W/OverviewJourneyList.tsx:36`** — bỏ "· z tài liệu" cho stage không chấm.
7. **`$C/billing/StageBalanceCards.tsx:21-47`** — lọc `stage.available && stage.serviceType`; `lockedCount` đếm `STAGES.filter((st) => !st.available)`; câu "giai đoạn sau chưa mở nên chưa có lượt chấm" chỉ hiện khi `lockedCount > 0` (kiểm điều kiện render hiện có).
8. **`$C/guided-documents/GuidedTemplateGallery.tsx:24-27`** — xóa `COMING_SOON_TEMPLATES`, `COMING_SOON_FILE_TEMPLATES` và hai comment; bỏ prop `comingSoon` ở lời gọi (`:77,:86`). Grep `comingSoon` trong `GuidedTemplateCard.tsx`, `GuidedFileTemplateCard.tsx`: nếu không còn nơi gọi thì xóa prop và nhánh render (clean cutover, không để cờ chết). KHÔNG thêm `cp4`/`pitch` vào `OPENABLE_TEMPLATES` (kiểu `AuditCheckpointCode`; checkpoint tạo lười khi xuất docx; `generate-docx.usecase.ts` đã chỉ đặt `current_checkpoint` cho CP1).
9. **`lib/event-details.ts:13`** — `CHECKPOINT_LABELS` chỉ có CP1-CP3, timeline sẽ hiện chữ thô "Đã mở giai đoạn PITCH". Dùng `findStageByCode(code)?.name` làm nguồn nhãn (thay bảng cứng) hoặc thêm CP4/PITCH; không để mã hiện ra UI.
10. **`components/landing/LandingJourney.tsx:18`** — thẻ 4: `title: "Tài chính và pitch"`, bỏ `soon: true`, thêm `text` ngắn cùng giọng thẻ 1-3 (mô tả doanh thu, P&L, bài pitch 10 mục). Giữ 4 cột và tiêu đề "Bốn giai đoạn" (A4). Làm bước này sau cùng; nếu `261018-1520-landing-redesign` đã viết lại file thì bỏ bước và ghi vào CHANGELOG.
11. **Không đổi (đã kiểm):** `stage-state.ts` (A8), `useNextActions.ts`, `audit-stage-ui.ts`, `credit-balances.ts`, `TabReportFindings.tsx`, `OverviewRecentReports.tsx`, `DocumentWorkspaceHeader.tsx`, `StageFilesView.tsx`, `StageDocumentUploadModal.tsx`, `credit-history/*`.

## Kiểm sau khi code

`cd apps/web-1 && bun run check-types` (gồm `next typegen`); `npx eslint --max-warnings 0` chỉ trên file đã đổi (lint cả web có sẵn 2 lỗi cũ); `cd apps/api && npx tsc --noEmit`; grep `comingSoon`, `goi-von-tai-chinh`, `COMING_SOON` trong `apps packages` (bỏ `.next`, `dist`) rỗng. apps/web-1 không có test tự động: smoke UI nằm ở phase 4.

## Acceptance

Trên trình duyệt, "Tài chính" và "Pitch deck" mở được, chỉ có Soạn thảo, không có nút chấm/mua, không chữ "hết lượt chấm", không chữ CP/PITCH; `?view=results` và `?view=files` rơi về Soạn thảo; thẻ số dư và timeline không có hàng thừa/mã thô; `tsc` sạch cho web và API.
