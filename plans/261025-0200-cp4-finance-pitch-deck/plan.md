---
title: "Mở CP4 Tài chính và Pitch deck (docx, chưa chấm AI)"
description: "Tách template cp4 thành cp4 (tài chính, 9 câu) và pitch (Pitch deck, 27 câu theo 10 mục demo pitching); thêm stage PITCH; stage không có dịch vụ chấm dùng được mà không hiện nút chấm/mua."
status: pending
priority: P1
effort: ~14h (ước lượng, chưa đo)
tags: [validation, shared, web-1, guided-documents, cp4, pitch]
blockedBy: []
blocks: []
created: 2026-10-25
branch: feat/cp4-pitch-deck (tách từ feat/attachment-manifest; PR #54 còn OPEN, 76 commit trước dev)
---

# Mở CP4 Tài chính và Pitch deck

Nguồn quyết định: `plans/reports/brainstorm-261025-cp4-finance-pitch-deck.md` (đã duyệt). Bản đồ code: 4 scout ngày 2026-10-25 (kết quả nằm trong các phase). Plan này nói làm gì và theo thứ tự nào; câu chữ từng câu hỏi do người làm viết theo chuẩn CP3.

## Quyết định đã chốt (user)

| # | Quyết định |
|---|---|
| D1 | Pitch deck bám 10 mục của hướng dẫn demo pitching 30.7 (Summer26). |
| D2 | Có phase Chuẩn bị Q&A, 5 câu cố định, không AI, trung lập cho mọi loại dự án. |
| D3 | Elevator pitch 60 giây nằm trong Pitch deck (phụ lục A), nhóm tự biên tập; hệ thống không tự tóm tắt. |
| D4 | CP4 mở tối thiểu, chỉ phần tài chính; Pitch deck là tài liệu chính, tách riêng. |
| D5 | Chưa chấm AI cho CP4/Pitch deck (chờ hướng dẫn Fall26); không nối `pl-validator`. |
| D6 | Tên hiển thị: "Tài chính" và "Pitch deck" (UI cấm CP1-CP4). |
| D7 | Doanh thu và giá chỉ hỏi ở CP4; Pitch deck có `pitch_bm_revenue` sao nguyên văn từ đó (rơi về CP3). |
| D8 | Nhãn tiêu chí (Team/PMF/Business Model/...) chỉ là gợi ý, không phải điểm; rubric 5x20 chưa xác định chính thức. |

## Giả định mặc định (user chưa chốt, đổi ở phase ghi trong ngoặc)

| # | Giả định | Phase |
|---|---|---|
| A1 | Viết lại cả 36 câu (9 cp4 + 27 pitch) theo chuẩn CP3: câu hỏi ngắn, "Cần nêu", đúng một cặp "Không đạt/Đạt", đúng một `suggested_actions`. Nếu muốn nhanh: câu cũ chỉ sửa chữ cấm, câu mới (9) viết đủ chuẩn; giảm ~4h. | 1, 2 |
| A2 | Đổi slug `goi-von-tai-chinh` thành `tai-chinh`. CP4 đang khóa nên chưa có URL sống; slug chỉ nằm ở `stages.ts` và `stage-descriptions.ts`. | 3 |
| A3 | Stage không chấm ẩn tab "Tài liệu" và "Kết quả chấm" (Nexus chỉ nhận docx ở CP4/Pitch deck), ép `?view=` về soạn thảo. | 3 |
| A4 | Landing chỉ đổi thẻ 4 thành thẻ thật "Tài chính và pitch" (bỏ "Sắp ra mắt"), giữ 4 cột; thẻ thứ 5 để sau (CSS landing đang nợ hex). | 3 |
| A5 | `classification`: cp4 bm/op = required, `fund_*` = supplemental; pitch mục 1-10 required trừ `responsible_ai_legal`, `team_gap`, `mvp_demo` (recommended); phụ lục A, B = recommended; Q&A = supplemental. | 1, 2 |
| A6 | Phụ lục A/B/C đánh số theo generator ("PHẦN 11: PHỤ LỤC A ..."); không sửa `docx-generator.ts`. | 1 |
| A7 | Tiến độ vẫn đếm cả câu tuỳ chọn (cp4 x/9, pitch x/27). | 3 |
| A8 | Stage không chấm không có trạng thái "xong": `nextCode` sẽ treo ở CP4 sau khi CP1-3 xong; chấp nhận. | 3 |

## Phases

| # | Phase | Ước lượng | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Template Pitch deck (thêm mới, chưa mở)](./phase-01-pitch-catalog.md) | 6h | không | pending |
| 2 | [Thu gọn CP4 thành Tài chính](./phase-02-cp4-finance-trim.md) | 2h | 1 | pending |
| 3 | [Mở stage: stage không chấm trên web](./phase-03-open-stages-web.md) | 4h | 2 | pending |
| 4 | [Verify, smoke, tài liệu, checklist deploy](./phase-04-verify-docs.md) | 2h | 3 | pending |

Thứ tự để mỗi commit đều xanh: phase 1 chỉ thêm (cp4 cũ còn nguyên, stage `PITCH` còn `available: false` chỉ để qua test tiền tố); phase 2 mới xóa 18 câu khỏi cp4 (không ai đang giữ câu trả lời `cp4_*` trên DB local); phase 3 mới bật `available: true`, nên không có lúc người dùng thấy stage chưa dùng được.

## Phạm vi

**Làm:** hai template, stage `PITCH`, điền sẵn qua `sync-rules`, xuất docx, web cho stage không chấm, wording, CHANGELOG và AGENTS.

**Không làm:** chấm AI/rubric/prompt/worker, `audit-checkpoints.ts`, `pl-validator`, upload tài liệu cho CP4/Pitch deck, sửa `docx-generator.ts`, thẻ landing thứ 5, mockup SVG cũ trong `docs/ux-redesign/`, migration DB (không cần: `checkpoint_code`, `question_id`, `doc_type` đều là `String`).

## Phụ thuộc giữa các plan

- Không chặn nhau với plan nào. `blockedBy: []`, `blocks: []`.
- `261020-2030-audit-service-registry` (pending, API-only): không chung file; `AuditCheckpointCode` vẫn chỉ CP1-CP3 nên slot CP3/CP4 "chưa mở" của plan đó không đổi.
- `261019-1500-case-detail-redesign` (ghi pending nhưng `StageDetail`, `StageHeader`, `JourneyTab` đã nằm trong cây): chung file web ở phase 3. Không sửa frontmatter plan đó; nếu có ai còn làm dở plan đó thì rebase phase 3 sau.
- `261018-1520-landing-redesign` (pending): chung `LandingJourney.tsx` (một dòng ở phase 3). Làm phase 3 landing sau cùng để dễ bỏ nếu xung đột.

## Rủi ro chính

1. Nút "Chấm bài" ở `ResultsEmptyState` gọi `triggerAudit` không có checkpoint nên mặc định CP1: bấm ở CP4/Pitch deck có thể chấm nhầm CP1. Giảm: phase 3 ẩn tab kết quả và ép `view`; test tay bằng `?view=results`.
2. `StageDetail.tsx:136` vỡ type khi CP4/PITCH `available: true` (`StageGradingPanel.checkpoint` là `AuditCheckpointCode`). Giảm: thu hẹp bằng `stage.serviceType !== null`, chạy `tsc`.
3. Đổi tiền tố `cp4_` thành `pitch_` mồ côi câu trả lời nếu prod có. Giảm: local đã kiểm 0/155; trước deploy bắt buộc chạy truy vấn prod (phase 4); nếu >0 thì dừng.
4. `sync-rules` chỉ sao nguyên văn nguồn đầu không rỗng. Elevator và `pitch_finance_summary` là nhóm tự viết; không hứa tự tổng hợp. Giảm: hướng dẫn trong câu hỏi trỏ mục nguồn.
5. Required chuỗi: câu `required` chưa trả lời khóa câu kế trong cùng phase (`useGuidedDocuments.ts:152-159`). Giảm: phase nhỏ, nhóm tuỳ chọn để `supplemental`.
6. Nhãn tiêu chí và nội dung Q&A dựa trên tài liệu Summer26, rubric chưa xác định chính thức. Giảm: ghi "gợi ý", nội dung ở file dữ liệu để Fall26 sửa nhanh.
7. `StageDetail.tsx` đã 204 dòng (vượt giới hạn 200). Giảm: không thêm logic dài; tách phần ẩn thành điều kiện nhỏ, không thêm file nếu không cần.

## Quy tắc dự án phải tuân

- Không đụng Prisma/DB; không chạy lệnh DB ghi. Truy vấn prod chỉ SELECT bằng `READONLY_DATABASE_URL`/guest theo `docs/db-query-guide.md`, chạy tay trước deploy.
- ESM import đuôi `.js`; hằng có tên; web theo `apps/web-1/AGENTS.md`; không hiện "CP1-CP4"/"Checkpoint N"/"PITCH" trên UI.
- Test từng file đã đổi (`cd apps/api && env -u LOG_LEVEL timeout 40 npx tsx --test <file>`); validation: `bun run build && bun run test`; không chạy cả bộ API (treo).
- Viết code xong mới chạy test. Commit nhỏ theo phase, conventional commit tiếng Anh; không đưa `turbo.json`, file html, `tmp/` vào commit.
- Rollback: `git revert` các commit phase (không migration); câu trả lời đã lưu `pitch_*` vẫn nằm trong `project_answers` nếu revert, vô hại.

## Kiểm sau khi code xong

Chi tiết ở phase 4: `check-types` (validation, API, web), `lint` web trên file đã đổi (web có 2 lỗi lint sẵn từ trước, xem plan CP3), test từng file, smoke docx hai template, smoke UI hai stage trên trình duyệt, checklist deploy.

## Triển khai (thứ tự và điều kiện)

1. Tạo nhánh `feat/cp4-pitch-deck` từ `feat/attachment-manifest`; làm phase 1 đến 4 theo thứ tự, mỗi phase một đến hai commit.
2. Deploy chỉ sau khi PR #54 vào dev và checklist deploy (phase 4 mục D) qua.
3. Build theo thứ tự: validation, API, web (API đọc `dist` của validation).
