# Phase 6 — Web

Đọc `apps/web-1/AGENTS.md` và `design-system/wording/AGENTS.md` trước. Quy tắc: Mantine v9; hook, không gọi `apiClient` trong component; file ≤ 200 dòng (tách khi vượt); **không hiện "CP1…CP4"** cho người dùng, dùng tên vòng ("Sản phẩm & mô hình", A9); không thêm bóng đổ lên Card/Paper; tiếng Việt trước.

Web hiện cứng `CP2` ở ~18 chỗ (đã scout). Thay vì thêm nhánh `isCp3`, dùng **một bảng cấu hình** `Record<AuditCheckpointCode, AuditStageUi>` (vd `AUDIT_STAGE_UI` trong `lib/` của case workspace) để `tsc` bắt được mã mới (brainstorm registry D20 đã nêu): `{ scopes, inputSources, packageKey, openLabel, reportTypes, selfCheck?, privacyNotice }`. CP1 khai báo nhánh riêng; CP2 và CP3 dùng chung thân.

## Việc làm

| Nhóm | File (đường dẫn dưới `app/dashboard/case/[id]/`) | Thay đổi |
|---|---|---|
| Gửi chấm | `hooks/useCp2Audit.ts`, `hooks/useTriggerAudit.ts`, `_components/workspace/stage/StageDetail.tsx:83-87,121`, `StageGradingPanel.tsx:85-118` | Hook chấm tổng quát theo `AUDIT_STAGE_UI`; payload CP3: `{checkpoint:"CP3", scope:"full", input_source, submission_type, change_summary, user_note}` |
| Xác nhận | `AuditConfirmModal.tsx`, `AuditStepOptions.tsx`, `AuditStepSources.tsx`, `stage-input.ts` | Thay `isCp2` bằng khả năng từ bảng cấu hình; CP3 chỉ nguồn (`answers`/`files`/`both`), **không** có lựa chọn phạm vi bảng hỏi; lời nhắc tệp phù hợp (BMC, SWOT) thay chữ khảo sát/phỏng vấn của CP2 |
| Mở vòng | `hooks/useOpenCheckpoint.ts`, `_components/guided-documents/GuidedTemplateGallery.tsx` | Tổng quát hóa mã checkpoint; bỏ `"cp3"` khỏi `COMING_SOON_TEMPLATES` (giữ `"cp4"`); nút "Bắt đầu vòng Sản phẩm & mô hình" |
| Mua gói | `lib/pricing.ts` (`PACKAGE_KEYS.CP3_AUDIT`), `_components/Cp2PackageCard.tsx` → thẻ gói tổng quát, `CreditQuantityModal.tsx` (suy ra "một lượt" từ metadata gói thay vì thêm nhánh CP), `receivables/PurchaseFields.tsx` (thêm `cp3_audit`) | |
| Sẵn sàng/tự kiểm | `hooks/useCp2Readiness.ts`, `Cp2AuditActions.tsx`, `Cp2AuditMenu.tsx`, `answer-quality.ts` (tiền tố `cp2_`) | CP3: ngưỡng câu được chấm (cùng env, đọc từ `answers_ready_full` của API), **không** có tự kiểm kiểu CP2 (`Cp2SelfCheck`) |
| Báo cáo | `_components/TabReportFindings.tsx:28,67-85` (bộ lọc `"CP1"|"CP2"`), `report.utils.ts:16-21` (`CP2_REPORT_TYPE_LABELS`), `workspace/stage/result-runs.ts:28-30`, `RoundCard.tsx`, `getScoreRows` hợp nhất | Thêm vòng thứ ba, nhãn "Vòng Sản phẩm & mô hình", nhãn loại báo cáo `cp3_full`/`cp3_full_resubmit` |
| Tệp | `workspace/StageFilesView.tsx:60-63`; danh mục tệp: `DOCUMENT_CATEGORY_CODES` (thêm `business_model_canvas` ở phase 2) được đọc bởi `workspace/stage/document-groups.ts`, `workspace/stage/StageDocumentUploadModal.tsx`, `intake/_components/Steps/DocumentInputStep.tsx` và `apps/api/.../documents/application/validate-document-write.ts` | Thông báo riêng tư cũng áp CP3; thêm nhóm và nhãn cho `business_model_canvas` ở từng nơi nêu trên; kiểm không có `Record<DocumentCategoryCode, …>` nào bị bỏ sót (tsc báo) |
| Tiến độ | `WorkerJobDetailDrawer.tsx:19-27` | Nhận cột mốc `cp3_evidence.json` (cùng cột "bằng chứng") |
| Trạng thái | `StageBalanceCards.tsx`, `JourneyTab.tsx`, `JourneyWorkspaceShell.tsx` | Tự hiện CP3 khi `stages.ts` có `available:true` + `serviceType`; kiểm bằng mắt |
| **Bước cuối** | `packages/shared/src/stages.ts` | Sau khi phase 4, 5 và các hàng trên đã kiểm xong: đặt CP3 `serviceType: "cp3_audit"`, `available: true`. Đây là công tắc mở dịch vụ; tách thành commit riêng để rollback bằng một lần revert |

## Thông báo "không chấm MVP" (D3)

Ba chỗ, cùng một câu ngắn, đúng giọng wording canonical:
1. Trình soạn câu hỏi (guided documents), đầu nhóm câu hỏi sản phẩm thử/giao diện: "Phần này bạn vẫn điền để hoàn thiện hồ sơ. Hệ thống không chấm phần sản phẩm thử và giao diện."
2. `AuditConfirmModal` (mô tả phạm vi chấm): "Chấm: Mô hình kinh doanh, SWOT, chiến lược, kết luận. Không chấm: sản phẩm thử và giao diện."
3. Thẻ gói (mục `features.items` của gói, phase 5).
Chữ cuối cùng do wording reference quyết; không viết "MVP" bằng tiếng Anh cho người dùng nếu wording canonical dùng từ khác (đọc `design-system/wording/`).

## Chữ CP2 sau phase 1

Rà các chuỗi: "Khảo sát .xlsx, ghi chép phỏng vấn .docx/.pdf" (`AuditStepSources.tsx:46-47`), "Bảng hỏi, logic khảo sát và bằng chứng" (`AuditStepOptions.tsx:100-101`), thông báo riêng tư khảo sát/phỏng vấn (`StageFilesView.tsx:61-63`): khảo sát giờ tùy chọn, phỏng vấn nêu "chuyên gia hoặc khách hàng".

## Test và kiểm

- Test hook/hàm thuần nếu repo web có khung test (scout: không tìm thấy test web CP2; nếu không có khung, không thêm test cho wiring).
- Bắt buộc: `bun run check-types`, `bun run lint` (zero warnings), duyệt thật bằng trình duyệt trên dev: mở vòng, điền câu hỏi, tải tệp, xác nhận chấm (cả ba nguồn), xem báo cáo, chấm lại, mua gói. Không hiện "CP3" ở bất kỳ chuỗi nào.

## Acceptance

`tsc` web sạch; kiểm chứng bảng cấu hình bằng cách thêm tạm một khóa giả vào `AuditCheckpointCode`, xác nhận compile báo lỗi, rồi bỏ khóa đó; luồng CP1 và CP2 không đổi hành vi (so sánh payload `/ai-retry`); ba thông báo không chấm MVP hiện đúng chỗ.
