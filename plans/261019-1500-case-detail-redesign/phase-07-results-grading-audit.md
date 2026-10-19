# Phase 7: Kết quả chấm + panel tiến trình + hộp thoại xác nhận

Priority: P2 · Status: Pending · Effort: 8h · blockedBy: Phase 4 · Q8

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/stage-results.js` (37), `grading.js` (46), `audit.js` (87), `REPORT.md` §7
- `research/scout-02` §2 "AuditConfirmModal", "StageGradingPanel", "Results"; `reports/gap-register.md` C-07, C-10, C-16, C-17, C-18
- Code: `stage/StageResultsView.tsx` (81), `TabReportFindings.tsx` (198), `RoundCard.tsx` (188), `stage/StageGradingPanel.tsx` (231), `stage/AuditConfirmModal.tsx` (284), `hooks/useCaseAiStatus.ts`, `hooks/useTriggerAudit.ts`, `useDownloadReportPdfById`, `RadarLogsViewer`

## Key insights
- **Modal chấm (284 dòng):** CP1 = bước 1 + dòng chi phí; CP2 = `Accordion` 4 mục (chấm gì / chấm tới đâu / lần chấm này / ghi chú). Luật: "questionnaire" ép `kind=initial`; `sourceReady`/`answersReadyFor` lấy từ `answers_ready_full`/`answers_ready_questionnaire` của server; "resubmit" hiện `changeSummary` (max 5000), ghi chú max 2000. **Giữ toàn bộ.** Mockup mô phỏng đơn giản ("ít nhất 1 câu"), không phải luật thật.
- `missingMandatoryCount` không bao giờ được truyền (C-16/Q8): cảnh báo vàng không hiện. Không sửa trong plan này trừ khi chủ dự án nói.
- **Panel chấm (231 dòng):** polling 5s khi queued/running; hiện khi active/failed/cancelled/completed-đã-xem (`seenActive`, `dismissed`); "Chạy lại" tái dùng `scope/inputSource/userNote/changeSummary`; "Báo lỗi qua Zalo" copy rồi mở `ZALO_GROUP_URL`; `RadarLogsViewer`; Stepper dọc dưới 48em. Mockup 5 trạng thái: Hàng đợi, Đang chấm, Hoàn tất, Gián đoạn, Đã dừng. A11y mockup lỗi: nhãn nút thu gọn không đổi thành "Mở rộng" và không `aria-live` → sửa ở bản thật.
- **Kết quả:** hiện là `RoundCard` accordion, mỗi thẻ 1 `iframe` + `LoadingOverlay`, link "Mở xem toàn màn hình", tải PDF từng thẻ; iframe ẩn dưới `sm`. Mockup: danh sách lần chấm (300px) trái + một khung PDF phải; **không điểm, không xu hướng** (điểm chỉ nằm trong PDF).
- Chấm lỗi → hoàn lượt: dòng ledger; panel báo "Gián đoạn".

## Requirements
**Kết quả (view=results)**
- ≥`md`: lưới `300px | 1fr`; trái danh sách ("Lần N", chip "Mới nhất" ở đầu, giờ chấm), phải: tên file, "PDF · Chấm lúc …", nút "Mở toàn màn hình" + "Tải PDF", khung iframe có `LoadingOverlay`.
- <`md`: danh sách gập ("Lịch sử chấm · Lần N, <thời gian>") + nút "Mở PDF"/"Tải PDF", **không** iframe (giữ cách hiện hành).
- Trống: "Chưa có kết quả chấm", 3 bước, nút "Chấm bài".
- Chọn lần chấm → URL không đổi (state cục bộ) hoặc `?run=`? **Không thêm tham số mới**; state cục bộ, mặc định lần mới nhất.

**Panel chấm**
- Header: chip trạng thái (`StatusChip`), tiêu đề, thời gian trôi qua (queued/running), `#<8 ký tự id job>`, nút hành động theo trạng thái (bảng ở scout-01); thân gập được (`aria-expanded`, nhãn đổi "Thu gọn"/"Mở rộng"); `aria-live="polite"` cho tiêu đề trạng thái.
- Hiện ở mọi tab (như hiện tại).

**Hộp thoại chấm**
- Mantine `Modal centered radius="md"` (không class vị trí), giữ 2 bước, `Accordion` CP2, radio `Radio.Group`, `Textarea` có `maxLength`.

## Architecture
```
StageResultsView.tsx (≤120)  chọn chế độ desktop/mobile
 ├─ ResultRunList.tsx         danh sách lần chấm
 ├─ ResultPdfViewer.tsx       header file + iframe + nút
 └─ result-runs.ts            chuyển rounds → items {id, label, when, isLatest, pdfUrl}
StageGradingPanel.tsx (≤150)  vỏ + polling hiện có
 ├─ GradingPanelHeader.tsx    chip + nút
 └─ GradingSteps.tsx          Stepper + logs
AuditConfirmModal.tsx (≤150)  vỏ + bước
 ├─ AuditStepSources.tsx      bước 1
 └─ AuditStepOptions.tsx      Accordion CP2 + dòng chi phí
```
`TabReportFindings`/`RoundCard` giữ nếu vẫn dùng ở nơi khác (LSP); nếu chỉ `StageResultsView` dùng thì thay thế.

## Related code files
**Modify:** `StageResultsView.tsx`, `StageGradingPanel.tsx`, `AuditConfirmModal.tsx`, `TabReportFindings.tsx`/`RoundCard.tsx` (hoặc xóa).
**Create:** `stage/ResultRunList.tsx`, `ResultPdfViewer.tsx`, `result-runs.ts` (+ test), `GradingPanelHeader.tsx`, `GradingSteps.tsx`, `AuditStepSources.tsx`, `AuditStepOptions.tsx`, `result-runs.module.css`.
**Delete:** `RoundCard.tsx`/`TabReportFindings.tsx` chỉ nếu LSP cho thấy không còn nơi dùng.

## Implementation steps
1. LSP references `RoundCard`, `TabReportFindings`, `StageGradingPanel`, `AuditConfirmModal`; `codegraph_explore` các hook `useCaseAiStatus`, `useTriggerAudit`.
2. Kịch bản trước sửa: queued→running→completed (invalidate `["case", id]`), failed→Chạy lại (tái dùng tham số), cancelled, dismiss, Zalo copy.
3. `result-runs.ts`: `toResultRuns(rounds, checkpointId)` giữ cách lọc hiện hành `checkpoint_id` với fallback theo loại báo cáo; sắp mới nhất trước; `isLatest` cho phần tử đầu; test 4 ca (0 lượt, 1 lượt, nhiều lượt, thiếu `checkpoint_id` fallback).
4. `ResultPdfViewer`: tái dùng `useDownloadReportPdfById`, URL `round.pdfUrl` (`/api/reports/:id/download?view=inline`), `LoadingOverlay`, `title` iframe cho a11y.
5. `StageResultsView`: `useMediaQuery("(min-width: 48em)")`; desktop lưới 2 cột, mobile danh sách gập + nút. Mặc định chọn lần mới nhất; chọn khác → `useState`.
6. `GradingPanelHeader`: map trạng thái → `{ tone, title, actions }`: Hàng đợi (warn), Đang chấm (draft), Hoàn tất (ok: Xem kết quả, Đóng), Gián đoạn (error: Chạy lại, Báo lỗi qua Zalo), Đã dừng (neutral: Chạy lại). Hàm thuần `describeGradingState(status)` + test 5 ca.
7. `GradingSteps`: giữ `Stepper` đang có + 4 bước mỗi giai đoạn lấy từ `audit-checkpoints.ts`; `RadarLogsViewer` trong `Collapse` mặc định đóng.
8. `AuditConfirmModal`: chỉ **tách file + đổi style**; mọi `disabled`/`forced` giữ y nguyên; dòng chi phí "Tốn 1 lượt - còn lại N sau lần chấm này"; kiểm không có chữ "CP". 
9. Smoke với dữ liệu thật hoặc `?grading=` giả lập không có: dùng ca dev có job; nếu không có job lỗi, đọc code và nói rõ trạng thái nào chưa tận mắt thấy.

## Todo
- [ ] LSP + kịch bản trước sửa
- [ ] `result-runs.ts` + test
- [ ] Viewer + danh sách + mobile
- [ ] `describeGradingState` + test
- [ ] Tách panel chấm ≤200
- [ ] Tách modal chấm ≤200, giữ luật
- [ ] A11y: `aria-live`, nhãn thu gọn
- [ ] Smoke 5 trạng thái + 2 chế độ (CP1/CP2)

## Success criteria
- Luật modal chấm giữ nguyên: questionnaire ép `initial`; resubmit đòi `changeSummary`; nút khóa khi không có gì để chấm.
- Panel chấm hiện đúng 5 trạng thái; "Chạy lại" dùng tham số lần trước.
- Desktop thấy PDF đúng lần chọn; mobile không có iframe nhưng mở/tải được.
- Mọi file ≤200 dòng; không `apiClient`/try-catch mới.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Không có job thất bại để thử | Nêu rõ trạng thái chưa thấy tận mắt; không báo "đã kiểm" |
| Mất tải PDF từng thẻ | Nút "Tải PDF" ở viewer + mobile |
| Thay đổi tách file làm mất `onPurchased` mở modal | Smoke gating P4 lại |

## Security
PDF iframe chỉ trỏ tới endpoint nội bộ có xác thực; không nhúng URL ngoài. Không log nội dung `changeSummary`/`userNote`.

## Next steps
P8.
