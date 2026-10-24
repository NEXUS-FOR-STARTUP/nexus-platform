# Phase 4 — Verify, smoke, tài liệu, checklist deploy

Quy ước: viết code xong mới chạy test; không chạy DB ghi (local chỉ SELECT hoặc qua UI local); phần chưa chứng minh ghi "chưa".

## A. Tự động

1. `bun run check-types` ở `packages/validation`, `apps/api` (kèm `prisma:generate`), `apps/web-1`.
2. `cd packages/validation && bun run build && bun run test` (cả thư mục, nhanh).
3. API từng file: `cd apps/api && env -u LOG_LEVEL timeout 40 npx tsx --test src/shared/infrastructure/tests/<file>` cho `stage-summaries`, `stage-audit-input`, `cp2-checkpoint-lifecycle`, `guided-documents` (chạy cả `guided-documents.test.ts` để chắc không lặp `TEMPLATE_KEYS`; scout chưa đọc nội dung). Không chạy cả bộ API (treo).
4. Lint web trên file đã đổi: `npx eslint --max-warnings 0 <files>`.

## B. Smoke (chạy thật, quan sát kết quả)

| # | Ca | Cách | Quan sát cần thấy |
|---|---|---|---|
| 1 | Docx hai template | Script tạm trong `apps/api` gọi `generateGuidedDocumentDocx` với `cp4` và `pitch`, trả lời vài câu; giải nén kiểm tiêu đề | `cp4`: 3 phần; `pitch`: 13 phần, phụ lục thành "PHẦN 11-13: PHỤ LỤC A-C"; câu chưa trả lời ghi "[Chưa có nội dung trả lời]"; tên file `..._Pitch_deck_...docx` / `..._Ke_hoach_tai_chinh_...docx`. Xóa script sau khi chạy. |
| 2 | Điền sẵn | Fixture `buildSyncProposals("pitch", ...)` (đã có trong test) + một lần gọi thật `GET /cases/:id/guided-documents/sync?templateKey=pitch` trên DB local | `pitch_bm_revenue` rơi cp4 -> cp3 -> cp1; câu không có nguồn không bị điền |
| 3 | UI hai stage | `bun run dev` (API 8000, web 3001), đăng nhập tài khoản local, mở một case: Hành trình, "Tài chính", "Pitch deck" | 5 hàng trong Hành trình; không "hết lượt chấm"; không nút Chấm/Mua; không tab Tài liệu/Kết quả; `?view=results` về Soạn thảo; 3 phase ở Tài chính, 13 ở Pitch deck; tiến độ x/9 và x/27 |
| 4 | Lưu và xuất docx | Trả lời một câu, lưu, bấm đồng bộ, xuất docx ở cả hai stage | Câu trả lời lưu được; docx tải về mở được; SELECT local: có hàng `CP4` và `PITCH` trong `checkpoints`, `cases.current_checkpoint` KHÔNG đổi |
| 5 | Gallery và thanh toán | Mở gallery tài liệu, thẻ Excel P&L; tab Thanh toán | Thẻ cp4, pitch, finance không còn khóa; thẻ Excel tải được; không thẻ số dư cho CP4/PITCH |
| 6 | Timeline | Xem lịch sử sau khi xuất docx | Không chữ "PITCH"/"CP4" thô |
| 7 | Nút CP3 (chưa từng chạy end-to-end sau sửa schema) | Ở gallery bấm "bắt đầu" thẻ giai đoạn Mô hình kinh doanh | Không lỗi 400; checkpoint CP3 được tạo (`POST .../CP3/open` 200) |

Chưa thể chứng minh bằng smoke: hành vi trên DB prod; đường upload file cho CP4/PITCH (đã ẩn, không phủ); chấm AI (không thuộc plan).

## C. Tài liệu (bắt buộc khi tính năng cố định)

1. `CHANGELOG.md` dưới `## [Unreleased]` (`:8`): thêm tiểu mục `### Added (2026-10-25) — Mở CP4 Tài chính và Pitch deck` và `### Changed` cho slug `tai-chinh`, tên stage, đổi tiền tố câu hỏi.
2. `apps/web-1/AGENTS.md:168` (luật cấm CP1-CP4): bổ sung tên vòng "Mô hình kinh doanh" (CP3), "Tài chính" (CP4), "Pitch deck" (PITCH) và cấm hiện mã `PITCH`. `AGENTS.md:153`: "never show CP1/CP2" thành bản bao quát CP1-CP4/PITCH.
3. `docs/research/brainstorm-2026-10-24-cp3-cp4-audit-service.md`: thêm ghi chú cập nhật (CP4 tách thành 9 câu + stage `PITCH`; dòng `:12` còn `COMING_SOON_TEMPLATES = ["cp3","cp4"]` đã lỗi thời từ trước).
4. `plans/reports/brainstorm-261025-cp4-finance-pitch-deck.md:7` đổi trạng thái; cập nhật cột Trạng thái các phase và `status` trong `plan.md`.
5. Dọn script tạm, kiểm `git status` chỉ còn file của plan (không `turbo.json`, html, `tmp/`).

## D. Checklist deploy (người làm, không phải agent)

1. PR #54 (`feat/attachment-manifest` vào `dev`) phải vào trước; nhánh này tách từ đó.
2. Prod, chỉ SELECT bằng tài khoản guest (`docs/db-query-guide.md`): (a) `select count(*) from project_answers where question_id like 'cp4\_%'` phải = 0; nếu > 0 thì DỪNG, cần plan di dời id riêng. (b) `select current_checkpoint, count(*) from cases group by 1` chỉ được `CP1` hoặc rỗng; ghi lại case có giá trị khác (trước sửa, docx CP2/CP3 có thể đặt sai).
3. Build theo thứ tự: validation (`dist`), API, web. Không migration.
4. Rollback: `git revert` các commit phase 3 rồi 2 rồi 1; câu trả lời `pitch_*` đã lưu nằm yên trong `project_answers`, vô hại.

## E. Điều kiện đóng plan

Phần A xanh; B1-B7 quan sát được (ghi "chưa" cho ca nào không chạy được, kèm lý do); C xong; D (2) có kết quả prod. Nếu đóng khi chưa smoke UI thì ghi nhận ngày và ca còn thiếu ở cuối file này.
