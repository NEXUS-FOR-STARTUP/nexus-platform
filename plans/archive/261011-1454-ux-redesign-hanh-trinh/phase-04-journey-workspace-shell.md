# Phase 4 — Journey workspace shell

## Context Links
- [plan.md](./plan.md), phase 1–3
- Thiết kế: `docs/ux-redesign/01-hanh-trinh.svg`, `02-chi-tiet-giai-doan.svg`, `03-cham-bai-va-mua-luot.svg`, `05-cac-phuong-an.svg` (A + D), `06-mobile.svg`
- `apps/web-1/app/dashboard/case/[id]/page.tsx`, `_components/WorkspaceSidebar.tsx`, `StatusGuidanceCard.tsx`, `TabReportFindings.tsx`, `DocumentWorkspace*`, `guided-documents/*`
- `apps/web-1/components/layout/AppShell.tsx:152-184` (mẫu Burger + Drawer)
- `apps/web-1/AGENTS.md` (Mantine v9, không thêm class định vị vào Modal/Drawer)

## Overview
- Priority: P1.
- Status: Pending.
- Dựng workspace mới: sidebar 5 mục, Tổng quan "Việc tiếp theo", Hành trình, trang chi tiết giai đoạn, hộp chấm bài. Viết ở file mới vì trang supporter (đóng băng) vẫn import các component cũ.

## Key Insights
- Supporter page import `WorkspaceSidebar`, `CaseStatusHeader`, `CaseOverviewPanel`, `DocumentWorkspace`, `TabDiscussionChat`, `ActivityTimeline` → không sửa đè các file này.
- Tab Báo cáo hiện ẩn tới khi có báo cáo; tab Tài liệu → báo cáo đánh giá không ghi giai đoạn.
- `GuidedTOC` đã tự thu gọn ở ≤767px; editor đã `flex-col md:flex-row`.
- Sidebar hiện là thanh icon, không có drawer.

## Requirements
URL (deep link, nút back chạy đúng):
- `?tab=overview | journey | billing | timeline | settings`
- `?tab=journey&stage=<slug>&view=draft|files|results&q=<question_id>`
- `?tab=` cũ (`guided`, `report`, `documents`, `credits`, `discussion`) chuyển sang tab mới tương ứng.

Sidebar (desktop): 5 mục cố định, không có Thảo luận. Mobile: Burger mở Drawer `hiddenFrom="md"` cùng danh sách.

Tổng quan (D):
- "Việc tiếp theo": tối đa 3 thẻ hành động, sinh từ `StageSummary` theo luật cố định:
  - Thiếu câu điều kiện đậu.
  - Có kết quả mới.
  - Chưa có đầu vào nào.
  - Đang chấm.
- Tóm tắt hồ sơ dự án + "Cập nhật hồ sơ".
- Thẻ nhóm Zalo (phase 6).

Hành trình:
- Lưới thẻ giai đoạn chính: tên, mô tả 1–2 dòng, chip trạng thái, tiến độ câu, số lượt, một nút.
- Chip lọc: Tất cả / Đang làm / Đã xong / Sắp ra mắt.
- Danh sách "Dịch vụ thêm" (Đánh giá đội ngũ). Không hiện giá.

Chi tiết giai đoạn:
- Breadcrumb "Hành trình / <tên>".
- Header: tên, chip trạng thái, "x/y câu · Còn n lượt chấm", Xuất DOCX, **Chấm bài**.
- Ba tab con:
  - Soạn thảo: dùng lại `GuidedTOC`, `GuidedQuestionCard`, `Cp2SelfCheck`.
  - Tài liệu nộp: upload qua `POST /cases/:id/stages/:checkpoint_code/documents` (phase 1); nhắc xóa email/SĐT khi là giai đoạn Thị trường.
  - Kết quả chấm: danh sách lần chấm của giai đoạn, PDF, "Chấm lại bản đã sửa". Empty state có nút "Chấm bài".

Chấm bài:
- Còn lượt → `AuditConfirmModal`:
  - Chọn phạm vi nếu giai đoạn có nhiều phạm vi.
  - Cảnh báo câu bắt buộc còn thiếu, kèm chú thích "vẫn chấm được".
  - Liệt kê những gì AI sẽ đọc.
  - Dòng "Dùng 1 lượt · còn n → n-1".
- Hết lượt → `ServiceCheckoutModal`; mua xong mở lại `AuditConfirmModal`.
- `active_audit` thuộc giai đoạn khác, hoặc API trả `409 AUDIT_IN_PROGRESS` → `notifications.show({ color: 'red', title: 'Đang chấm <tên giai đoạn>', message: 'Mỗi dự án chấm một giai đoạn một lúc. Khi xong bạn chấm tiếp được.' })`, không mở modal.
- `409 STAGE_INPUT_REQUIRED` → notification đỏ kèm thông điệp server và đưa sang tab Soạn thảo.
- Đang chấm: chip "Đang chấm" trên header và thẻ; poll `GET /cases/:id/stages` theo khoảng cấu hình.

Giai đoạn `available: false`: thẻ mờ, nút "Báo tôi khi mở" tắt (chưa có backend thông báo, chỉ hiện "Sắp ra mắt"). Mở bằng URL thì hiện empty state "Sắp ra mắt", không cho soạn.

Bỏ khỏi trang sinh viên: `StatusGuidanceCard`, gallery template, tab Báo cáo, tab Tài liệu chung, tab Thảo luận, nút "Xác nhận hoàn thành", `Cp2AuditMenu`, `Cp2AuditActions`.

## Architecture
```
case/[id]/page.tsx  (orchestrator mỏng: useCaseDetails + useStageSummaries + router)
├─ workspace/JourneySidebar.tsx        (+ JourneyMobileNav.tsx: Burger + Drawer)
├─ workspace/OverviewTab.tsx           (NextActions.tsx, ProfileSummaryCard.tsx, ZaloSupportCard.tsx)
├─ workspace/JourneyTab.tsx            (StageCard.tsx, ExtraServiceList.tsx)
├─ workspace/stage/StageDetail.tsx     (StageHeader.tsx, StageDraftView.tsx, StageFilesView.tsx, StageResultsView.tsx)
├─ workspace/stage/AuditConfirmModal.tsx
└─ billing/BillingTab.tsx (phase 3)
hooks: useStageSummaries.ts, useStageAudit.ts (gộp useTriggerAudit + useCp2Audit theo checkpoint_code), useNextActions.ts (hàm thuần)
```
- Mỗi file ≤200 dòng; không gọi `apiClient` trực tiếp trong component; không try/catch trong component.
- Luật "Việc tiếp theo" là hàm thuần `buildNextActions(stages, answers)`.

## Related Code Files
Tạo: các file ở cây trên.
Sửa: `case/[id]/page.tsx` (rẽ nhánh theo `NEXT_PUBLIC_JOURNEY_WORKSPACE`: `true` → shell mới, `false` → giữ nguyên trang cũ), `guided-documents/GuidedDocumentsEditor.tsx` (tách phần header sang `StageHeader`). Thêm hook `useStageDocumentUpload` gọi endpoint mới; `useCaseDocumentUploads` cũ giữ cho trang cũ.
Xóa ở phase 7 (sau khi flag bật ổn định; kiểm người gọi bằng LSP references): `StatusGuidanceCard.tsx`, `statusCopyMap.ts`, `GuidedTemplateGallery.tsx`, `GuidedTemplateCard.tsx`, `TabReportFindings.tsx` (nếu supporter không dùng), `Cp2AuditMenu.tsx`, `Cp2AuditActions.tsx`, `useCp2Audit.ts`, `useCp2Readiness.ts`, `useTriggerAudit.ts`, `useCaseDocumentUploads.ts` phần revision.

## Implementation Steps
1. `useStageSummaries`, `useStageAudit` (lỗi 409 → notification theo `details.checkpoint_code`).
2. Sidebar desktop + mobile drawer; router tab và chuyển hướng tab cũ.
3. Hành trình + StageCard.
4. StageDetail + 3 view; nối `useStageDocumentUpload`.
5. `AuditConfirmModal` ↔ `ServiceCheckoutModal`.
6. Tổng quan + `buildNextActions`.
7. Gỡ component cũ khỏi trang sinh viên; xóa file không còn người gọi.
8. Kiểm tra thật trên trình duyệt: desktop 1440, tablet 768, phone 375; dark mode; tab cũ chuyển hướng đúng.

## Todo List
- [ ] Hooks summaries/audit
- [ ] Sidebar + drawer mobile + router
- [ ] Hành trình
- [ ] Chi tiết giai đoạn (3 view)
- [ ] Hộp chấm ↔ hộp mua; notification đang chấm
- [ ] Tổng quan "Việc tiếp theo"
- [ ] Gỡ và xóa component cũ
- [ ] Kiểm tra trình duyệt 3 kích thước

## Success Criteria
- Người dùng mới đi: tạo dự án → Hành trình → Thị trường → soạn/tải file → Chấm bài → mua → chấm, không gặp khối giá nào ngoài hộp mua.
- Bấm chấm Ý tưởng khi Thị trường đang chấm → notification đỏ "Đang chấm Thị trường".
- Không còn chỗ nào trong UI sinh viên hiện chữ "CP1/CP2/Checkpoint".
