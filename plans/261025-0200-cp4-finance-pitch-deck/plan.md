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

Nguồn quyết định: `plans/reports/brainstorm-261025-cp4-finance-pitch-deck.md` (đã duyệt). Giả định A1-A8 và rủi ro nằm trong từng phase (xem bảng Phases). Câu chữ từng câu hỏi do người làm viết theo chuẩn CP3.

## Quyết định đã chốt (user)

| # | Quyết định |
|---|---|
| D1 | Pitch deck bám 10 mục của hướng dẫn demo pitching 30.7 (Summer26). |
| D2 | Phase Chuẩn bị Q&A: 5 câu cố định, không AI, trung lập mọi loại dự án. |
| D3 | Elevator pitch 60 giây là phụ lục A của Pitch deck, nhóm tự biên tập, hệ thống không tự tóm tắt. |
| D4 | CP4 mở tối thiểu chỉ phần tài chính; Pitch deck là tài liệu chính, tách riêng. |
| D5 | Chưa chấm AI cho CP4/Pitch deck (chờ Fall26); không nối `pl-validator`. |
| D6 | Tên hiển thị "Tài chính" và "Pitch deck" (UI cấm CP1-CP4). |
| D7 | Doanh thu và giá chỉ hỏi ở CP4; Pitch deck sao nguyên văn từ đó (rơi về CP3). |
| D8 | Nhãn tiêu chí chỉ là gợi ý; rubric 5x20 chưa xác định chính thức. |

## Phases

| # | Phase (giả định và rủi ro trong file) | Ước lượng | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Template Pitch deck (thêm mới, chưa mở)](./phase-01-pitch-catalog.md) | 6h | không | pending |
| 2 | [Thu gọn CP4 thành Tài chính](./phase-02-cp4-finance-trim.md) | 2h | 1 | pending |
| 3 | [Mở stage: stage không chấm trên web](./phase-03-open-stages-web.md) | 4h | 2 | pending |
| 4 | [Verify, smoke, tài liệu, checklist deploy](./phase-04-verify-docs.md) | 2h | 3 | pending |

Thứ tự để mỗi commit đều xanh: phase 1 chỉ thêm (cp4 cũ còn nguyên, `PITCH` còn `available: false`); phase 2 mới xóa 18 câu khỏi cp4; phase 3 mới bật `available: true`, nên không có lúc người dùng thấy stage chưa dùng được.

## Phạm vi

**Làm:** hai template, stage `PITCH`, điền sẵn qua `sync-rules`, xuất docx, web cho stage không chấm, wording, CHANGELOG và AGENTS.

**Không làm:** chấm AI/rubric/prompt/worker, `audit-checkpoints.ts`, `pl-validator`, upload tài liệu cho CP4/Pitch deck, sửa `docx-generator.ts`, thẻ landing thứ 5, mockup SVG cũ, migration DB (không cần: `checkpoint_code`, `question_id`, `doc_type` đều là `String`).

## Phụ thuộc giữa các plan

- Không chặn nhau (`blockedBy: []`, `blocks: []`). `261020-2030-audit-service-registry`: không chung file, `AuditCheckpointCode` vẫn chỉ CP1-CP3.
- Chồng file web ở phase 3: `261019-1500-case-detail-redesign` (ghi pending nhưng code đã nằm trong cây) và `261018-1520-landing-redesign` (chung `LandingJourney.tsx`, làm bước landing sau cùng). Không sửa frontmatter hai plan đó.

## Quy tắc dự án phải tuân

- Không đụng Prisma/DB. Truy vấn prod chỉ SELECT bằng guest (`docs/db-query-guide.md`), chạy tay trước deploy.
- ESM import đuôi `.js`; hằng có tên; web theo `apps/web-1/AGENTS.md`; UI không hiện "CP1-CP4"/"Checkpoint N"/"PITCH".
- Test từng file đã đổi (`cd apps/api && env -u LOG_LEVEL timeout 40 npx tsx --test <file>`); validation: `bun run build && bun run test`; không chạy cả bộ API (treo).
- Viết code xong mới chạy test. Commit nhỏ theo phase, conventional commit tiếng Anh; không đưa `turbo.json`, file html, `tmp/` vào commit.
- Rollback: `git revert` phase 3, 2, 1 (không migration); câu trả lời `pitch_*` đã lưu nằm yên, vô hại.

## Triển khai (thứ tự và điều kiện)

1. Tạo nhánh `feat/cp4-pitch-deck` từ `feat/attachment-manifest`; phase 1 đến 4 theo thứ tự, mỗi phase một đến hai commit.
2. Deploy chỉ sau khi PR #54 vào dev và checklist deploy (phase 4, mục D) qua; build validation, API, web theo thứ tự đó.
