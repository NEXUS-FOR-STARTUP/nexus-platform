# Phase 2 — Thu gọn CP4 thành Tài chính

Xóa 18 câu đã chuyển sang `pitch_*` khỏi `cp4`, viết lại 9 câu còn lại. Điều kiện vào: phase 1 xanh. Trước khi xóa, kiểm lại DB local `select count(*) from project_answers where question_id like 'cp4\_%'` (lần trước = 0/155) bằng `READONLY_DATABASE_URL`; nếu > 0 thì dừng và hỏi user.

## Việc làm

1. **`catalogs/questions-cp4.ts`** — còn 9 câu: `cp4_bm_revenue_streams`, `cp4_bm_unit_economics`, `cp4_op_pl_assumptions`, `cp4_op_break_even`, `cp4_op_sustainability`, `cp4_fund_path`, `cp4_fund_ask`, `cp4_fund_use_of_funds`, `cp4_fund_school_support`. Viết lại theo chuẩn CP3 (cùng chuẩn phase 1). Sửa chữ cấm đã tìm thấy: "tab Tài chính"/"Finance tab" (tab đã bỏ, `TabFinance.tsx:1-2`) thành "file Excel P&L" ở `bm_unit_economics` và `op_pl_assumptions`; "gọi vốn" thành "nguồn vốn" ở `fund_path` (text và explanation); "Theo syllabus" thành "Theo quy định môn học" ở `fund_school_support`; bỏ chữ "Checkpoint"/"syllabus" trong comment đầu file. `fund_path` hỏi nguồn vốn (vốn tự có, tái đầu tư, vốn góp nhóm, nhà đầu tư) cho mọi Track, không chỉ nhóm gọi vốn.
2. **`catalogs/cp4.ts`** — `title: "Kế hoạch tài chính"`, `description: "Doanh thu và giá, giả định P&L, điểm hòa vốn, kế hoạch sinh tồn và nguồn vốn."` (bỏ "gọi vốn"). 3 phase, `unlock_requires: []`:
   - `revenue`: "Doanh thu và giá" — `cp4_bm_revenue_streams`, `cp4_bm_unit_economics` (required).
   - `sustainability`: "Giả định và sinh tồn" — `cp4_op_pl_assumptions`, `cp4_op_break_even`, `cp4_op_sustainability` (required).
   - `funding`: "Nguồn vốn (tuỳ chọn)" — `cp4_fund_path`, `cp4_fund_ask`, `cp4_fund_use_of_funds`, `cp4_fund_school_support` (supplemental).
3. **`catalogs/sync-rules.ts`** — `cp4` chỉ còn `cp4_bm_revenue_streams` <- `cp3_bmc_revenue_streams`, `cp1_revenue_model` (`:67-77` hiện 9 rule trỏ id đã xóa; xóa 8 rule còn lại, vì mọi câu khác đã chuyển sang `pitch`).
4. **`catalogs/file-templates.ts:4,53`** — bỏ chữ "CP4" khỏi `financeTemplate.description` (hiện trên gallery): ví dụ "File Excel mẫu để nhóm tự lập bảng lãi lỗ dự báo." Comment dòng 4 cũng bỏ "cp1..cp4".
5. **Test** — `catalog-validation.test.ts` giữ `validateCatalog(cp4)`; `sync-rules.test.ts` cập nhật các test cũ nhắc rule cp4 đã xóa. `cp2-checkpoint-lifecycle.test.ts:151` thêm `['pitch', []]` vào mảng (đã có `cp4`). `stage-audit-input.test.ts` thêm một ca: `renderStageAnswers("CP3", ...)` không chứa câu `cp4_*`/`pitch_*` đã lưu.

## Kiểm sau khi code

`cd packages/validation && bun run build && bun run test`; `bun run check-types` (validation, API, web); API: `env -u LOG_LEVEL timeout 40 npx tsx --test` cho `stage-summaries`, `stage-audit-input`, `cp2-checkpoint-lifecycle`. Grep `cp4_pitch_|cp4_team_|cp4_pmf_|cp4_vision_|cp4_op_roadmap|cp4_op_marketing|cp4_op_risks|cp4_bm_canvas` trong `apps packages` (bỏ `.next`, `dist`) phải rỗng.

## Acceptance

`cp4` có đúng 9 câu / 3 phase, không còn id cũ ở bất kỳ file nào; không câu nào trong cp4 chứa "tab Tài chính", "gọi vốn", "syllabus", "Checkpoint"; mọi test liên quan xanh.

## Giả định (user chưa chốt)

- **A1** Cùng chuẩn viết lại như phase 1: cả 9 câu theo chuẩn CP3 (phương án nhanh: chỉ sửa chữ cấm).
- **A5** `classification`: cp4 `bm_*` và `op_*` required; `fund_*` supplemental.

## Rủi ro

1. Đổi tiền tố `cp4_` thành `pitch_` mồ côi câu trả lời nếu có dữ liệu. Giảm: local đã kiểm 0/155 và phải kiểm lại trước khi xóa; prod phải kiểm ở phase 4 mục D trước deploy, nếu > 0 thì dừng.
2. Xóa 8 rule `sync-rules` của cp4 làm vỡ test cũ nhắc chúng. Giảm: cập nhật test trong cùng commit.
