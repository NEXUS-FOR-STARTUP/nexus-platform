---
title: "Tinh gọn CP3/CP4 theo giá trị khách: Excel trong stage Tài chính, câu chọn track, DOCX ghi TUỲ CHỌN, bỏ câu kết luận lặp của CP3"
description: "Bốn thay đổi nhỏ, tách độc lập: (1) DOCX gắn nhãn TUỲ CHỌN; (2) CP3 bỏ cp3_key_findings + check c3_findings_grounded; (3) stage Tài chính hiện thẻ tải Excel; (4) câu chọn Scalable/Traditional (radio + Khác)."
status: pending
priority: P2
effort: ~9h (ước lượng, chưa đo)
tags: [validation, api, web-1, guided-documents, cp3, cp4, docx]
blockedBy: []
blocks: []
created: 2026-10-25
mode: fast
---

# Tinh gọn CP3/CP4 theo giá trị khách

Nguồn quyết định: `plans/reports/brainstorm-261025-cp3-cp4-customer-value-review.md` (user đã chốt từng điểm trong phiên brainstorm).

## Quyết định đã chốt (user)

| # | Quyết định |
|---|---|
| D1 | CP4 giữ câu hỏi; file Excel `finance` hiện ngay trong stage Tài chính (đang chỉ ở gallery). |
| D2 | Giữ cả 4 câu `cp4_fund_*`, tùy chọn; không thêm logic ẩn/hiện. |
| D3 | Thêm câu chọn Scalable/Traditional: radio + "Khác" có ô nhập; tùy chọn; không ẩn câu nào. |
| D4 | CP3: bỏ `cp3_key_findings` + check `c3_findings_grounded`; giữ `cp3_business_feasibility`, `cp3_future_development`. |
| D5 | Không đối chiếu số với Excel, không AI/hệ thống tự tính hoặc chấm số tài chính. |
| D6 | DOCX hiện đủ mọi câu; câu `supplemental` ghi "TUỲ CHỌN" viết hoa. |

## Phases

| # | Phase | Ước lượng | Phụ thuộc |
|---|---|---|---|
| 1 | [DOCX gắn nhãn TUỲ CHỌN](./phase-01-docx-optional-label.md) | 1.5h | không |
| 2 | [CP3 bỏ câu tóm tắt lặp](./phase-02-cp3-drop-key-findings.md) | 2.5h | không |
| 3 | [Stage Tài chính hiện thẻ Excel](./phase-03-cp4-excel-in-stage.md) | 1.5h | không |
| 4 | [Câu chọn track (radio + Khác)](./phase-04-track-choice-question.md) | 3.5h | 1 (cách DOCX in câu chọn) |

Phase 1, 2, 3 độc lập; làm theo thứ tự 1 → 4 vì phase 4 dùng chỗ in câu trả lời ở phase 1. Commit riêng mỗi phase.

## Không làm (và vì sao)

- Rà viết lại hint 4 câu A-D của CP4: đã đọc `questions-cp4.ts`, hint đã nêu số khách, tỷ lệ chuyển đổi, đơn giá, căn cứ thị trường, sweat equity, kịch bản xấu. Khớp đề; không có gì cần sửa.
- Hiện TAM/SAM/SOM của CP2 cạnh câu doanh thu; sắp phản hồi CP3 theo tier; gộp check audit chồng nhau (cần điểm case thật): chưa quyết, không thuộc đợt này.
- Đối chiếu Excel (D5), migration DB (không cần: `project_answers.answer_text` là `Text`), chấm AI cho CP4.

## Phụ thuộc giữa các plan

- `261025-0200-cp4-finance-pitch-deck` (in-progress, `blockedBy: []`): cùng cp4. Không chung file chưa-xong; phase 4 của nó còn "smoke UI, kiểm DB prod". Plan này không chặn và không bị chặn. Khác biệt cần biết: plan đó ghi "Không làm: sửa `docx-generator.ts`", plan này có sửa (phase 1); số câu CP4 từ 9 thành 10 (thêm `cp4_fund_track`). Chạy smoke UI của hai plan cùng một lượt khi xong.
- `261024-2300-cp3-audit-cp2-rubric` (completed): phase 2 sửa kết quả của plan này (`cp3-audit-checks.ts`, prompt CP3). Không cần đổi frontmatter plan đã xong.

## Quy tắc dự án phải tuân

- Không đụng Prisma/DB, không migration. Truy vấn prod chỉ SELECT bằng guest (`docs/db-query-guide.md`), chạy tay trước deploy.
- ESM import đuôi `.js`; hằng có tên; file dưới 200 dòng; web theo `apps/web-1/AGENTS.md` (Mantine, không hiện "CP1-CP4" trong UI).
- Test từng file đã đổi: `cd apps/api && env -u LOG_LEVEL timeout 40 npx tsx --test <file>`; validation: `cd packages/validation && bun run build && bun run test` (API đọc `dist`, phải build lại); `npx tsc --noEmit` trong package đã đổi. KHÔNG chạy cả bộ API (treo).
- Commit nhỏ theo phase, conventional commit tiếng Anh; không đưa `turbo.json`, file html, `tmp/` vào commit.

## Kiểm cuối (sau phase 4)

1. `validation`: build + test xanh; `api`: tsc + test từng file đã đổi; `web-1`: tsc.
2. Smoke thật: chạy dev, mở `/dashboard/case/<id>?tab=journey&stage=tai-chinh&view=draft`, thấy thẻ Excel, chọn Scalable, chọn Khác + nhập chữ, tải lại vẫn đúng, xuất DOCX và đọc nội dung (mục TUỲ CHỌN).
3. Cập nhật `CHANGELOG`, `AGENTS.md` (số câu CP3 còn 19, CP4 10), `docs/` nào nhắc "20 câu" của CP3.

## Rollback

`git revert` theo phase ngược 4 → 1; không migration. Câu trả lời `cp3_key_findings` đã lưu không bị xoá (chỉ bị bỏ khỏi template và bỏ khỏi đếm); câu trả lời `cp4_fund_track` lưu JSON, vô hại nếu code cũ.

## Rủi ro chung

| Rủi ro | Xử lý |
|---|---|
| Báo cáo CP3 đã lưu có check `c3_findings_grounded`; bỏ khỏi catalog có thể làm chấm điểm/hiển thị lỗi | Phase 2 bước 6: đọc `scoreCp2Report` + `cp3-report-display`, chạy với fixture có id cũ |
| Câu trả lời `cp3_key_findings` còn trong DB làm số "đã trả lời" lớn hơn tổng | Phase 2 bước 4: đếm chỉ câu có trong catalog |
| Generator DOCX dùng chung mọi template, đổi nhãn áp cho cp1-cp4 và pitch | Phase 1: chủ ý; test hồi quy trên một template |
