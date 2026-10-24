# Phase 2 — Tầng validation CP3

Mục tiêu: CP3 dùng lại scorer, schema zod và validator CLI của CP2 (`CP2_SCHEMAS` là bảng `schemaId → {kind, checks, weights}`; `scoreCp2Report` và `Cp2ReportSchema` đọc từ bảng đó; validator `.mjs` nhận danh sách schema id qua tham số). Việc cần làm là **thêm dữ liệu**, không nhân đôi logic. Tên `Cp2*` giữ nguyên (đổi tên là churn, ngoài phạm vi); thêm một dòng comment ở bảng nói rằng bảng chung cho mọi dịch vụ chấm có điểm.

## File

- Mới: `packages/validation/src/catalogs/cp3-audit-checks.ts`, `cp3-report-display.ts`
- Sửa: `cp2-audit-checks.ts` (đăng ký schema CP3 + kind verdict mới), `cp2-report-display.ts` hoặc module hợp nhất loại báo cáo, `index.ts` (export), `DOCUMENT_CATEGORY_CODES`/`DOCUMENT_CATEGORY_LABELS` trong `packages/validation/src/index.ts`
- Test: `packages/validation/src/__tests__/cp3-audit.test.ts` (mới), mở rộng test đồng bộ prompt↔catalog

## Bảng check CP3 (A6: đề xuất, chờ duyệt)

Prefix id `c3_`. 24 tiêu chí, 7 nhóm, 3 cổng, 5 core. Mức `gate` trần 49 (trượt) / 74 (một phần); `core` trần 74 khi trượt; `normal` chỉ trừ điểm. Trọng số tier: gate/core = 2, normal = 1 (theo `cp2-audit-score.ts`).

| Nhóm (trọng số) | id | Mức | Căn cứ trong tài liệu cô |
|---|---|---|---|
| customer_value (20) | `c3_segment_narrow` | core | "không chọn phân khúc quá rộng"; ô 1: cho ai, ở đâu, quy mô tiêu thụ |
| | `c3_usp_differentiated` | core | khác biệt, khó bắt chước, tính mới |
| | `c3_value_fits_pain` | normal | liên kết ô 2↔1 |
| | `c3_channels_fit_segment` | normal | ô 3: kênh truyền thông và kênh bán |
| | `c3_retention_mechanism` | normal | ô 4: thu hút và giữ chân |
| money_model (20) | `c3_revenue_concrete` | normal | ô 5: nguồn thu chính, cách tính tiền; số là điểm cộng |
| | `c3_cost_quantified` | normal | ô 9: chi đầu tư ban đầu / chi vận hành, khoản chính được gọi tên |
| | `c3_revenue_vs_cost` | normal | doanh thu cạnh chi phí không tự mâu thuẫn |
| operations (10) | `c3_resources_to_activities` | normal | ô 6↔7 (nhân lực, tài lực, máy móc, công nghệ, mặt bằng, vốn) |
| | `c3_activities_create_value` | normal | ô 7 |
| | `c3_partners_dependency` | normal | ô 8: nhà cung cấp, cố vấn, mức phụ thuộc |
| bmc_coherence (10) | `c3_bmc_complete` | **gate** | "điền đầy đủ và logic 9 ô" |
| | `c3_bmc_no_contradiction` | core | "liên kết chặt chẽ" |
| swot_evidence (20) | `c3_swot_complete` | **gate** | đủ S, W, O, T có nội dung thật |
| | `c3_swot_quantified` | **gate** | "từng yếu tố… phải có dữ liệu định lượng đi kèm" |
| | `c3_weakness_honest` | normal | điểm yếu thật, không phải điểm mạnh trá hình |
| | `c3_opportunity_sourced` | normal | cơ hội có nguồn kiểm chứng được |
| | `c3_threat_competition` | normal | có thách thức từ đối thủ/giải pháp thay thế, chỉ xét trong tài liệu CP3 |
| strategy (10) | `c3_strategies_complete` | core | có đủ bốn loại chiến lược (mạnh+cơ hội, mạnh+thách thức, yếu+cơ hội, yếu+thách thức) |
| | `c3_strategy_pairing` | core | mỗi chiến lược truy được về yếu tố nó dựa vào, ghép đúng loại; **không bắt mã S1/W1** |
| | `c3_strategy_actionable` | normal | hành động cụ thể, dựa trên số liệu hoặc xu hướng, làm được trong thời gian dự án |
| conclusion (10) | `c3_findings_grounded` | normal | phát hiện chính cụ thể, có số, khớp phần trên; **không đánh giá MVP tốt/xấu** |
| | `c3_feasibility_evidence` | normal | khả thi có bằng chứng đỡ và nêu điều chưa chắc chắn; không đếm số lý do |
| | `c3_next_steps_actionable` | normal | bước tiếp theo cụ thể, gắn kết quả mong đợi; không bắt chia ngắn/trung/dài hạn |

Không có `not_applicable` ở CP3 (không tiêu chí nào có điều kiện loại trừ). Không có tiêu chí so sánh với CP1/CP2 (xem phase 3: `crossIssues`). Nhãn verdict mới (kind `business_model`): `SẴN SÀNG TRÌNH BÀY` / `CẦN BỔ SUNG` / `CHƯA ĐỦ YÊU CẦU BẮT BUỘC`.

Trọng số trong catalog là **hằng có tên** (`CP3_FULL_GROUP_WEIGHTS`), không rải trong logic: nếu cô đổi trọng số sau này chỉ sửa một chỗ.

## Việc làm

1. `cp3-audit-checks.ts`: `Cp3FullGroup`, `CP3_FULL_CHECKS` (24), `CP3_FULL_GROUP_WEIGHTS`, hằng `CP3_UNGRADED_PHASE_IDS`/danh sách câu hỏi được chấm suy ra từ `TEMPLATE_REGISTRY.cp3` (loại phase MVP/UX theo id phase đọc từ `cp3.ts`, không liệt kê 20 id bằng tay).
2. `cp2-audit-checks.ts`: thêm `CP2_VERDICTS.business_model`, đăng ký `cp3_full_v1`, `cp3_full_resubmit_v1` trong `CP2_SCHEMAS` (kind `business_model`). `scoreCp2Report` chọn verdict theo kind: đọc code để chắc chắn chỗ tra nhãn dùng `def.kind`.
3. Báo cáo/hiển thị: `CP3_REPORT_TYPES = ["cp3_full","cp3_full_resubmit"]`, nhãn nhóm hiển thị CP3, và hàm hợp nhất `isScoredReportType` / `getScoreRows(reportType, categoryScores)` (CP2 + CP3) để PDF, controller và web không rẽ nhánh theo CP.
4. `DOCUMENT_CATEGORY_CODES`: thêm `business_model_canvas`, nhãn "Mô hình kinh doanh / SWOT" (D13 của brainstorm registry đã chờ mã này). Kiểm test `attachment-manifest.test.ts`.
5. Test đồng bộ prompt↔catalog: regex hiện `(fr|qr)_`; mở rộng cho `c3_` và cho phép một danh sách (file, prefix, catalog).
6. Validator CLI: xác nhận `validate-cp2-report.mjs` nhận `cp3_full_v1,cp3_full_resubmit_v1` qua tham số (không cần bundle mới). Nếu `Cp2ReportSchema` còn giả định về `itemReviews`/`boardQuestions` của CP2, đọc code để chắc chúng tùy chọn.

## Test

- 24 id, nhóm hợp lệ, tổng trọng số = 100, gate = {`c3_bmc_complete`, `c3_swot_complete`, `c3_swot_quantified`}, core = 5 id nêu trên.
- Điểm: một gate fail → ≤ 49 và nhãn "chưa đủ"; gate partial hoặc core fail → ≤ 74; chỉ normal fail → không bị trần; tất cả pass → 100; chuẩn hóa khi một nhóm không có tiêu chí được chấm (không xảy ra ở CP3 nhưng giữ test chung).
- Câu hỏi MVP không nằm trong danh sách câu được chấm.

## Acceptance

`bun run check-types` sạch; test validation (cả CP2 sau phase 1) xanh; `CP2_SCHEMA_IDS` chứa `cp3_*` mà báo cáo CP2 cũ vẫn hợp lệ.
