# Phase 1 — Template Pitch deck (thêm mới, chưa mở)

Chỉ thêm, không xóa gì: `cp4` giữ nguyên 27 câu `cp4_*` trong phase này. Commit cuối phase phải xanh `bun run test` của validation và `stage-summaries.test.ts`.

## Việc làm

1. **`packages/validation/src/catalogs/questions-pitch.ts` (mới)** — export `PITCH_QUESTIONS`, 27 câu. Shape `Question` = `{ id, text, explanation, suggested_actions: string[], further_reading? }` (`types.ts:20-26`). Chuẩn viết lấy từ `questions-cp3.ts:68-80` (`cp3_bmc_revenue_streams`):
   - `text`: một câu hỏi ngắn (~8-15 từ), kết thúc `?`.
   - `explanation`: một dòng mục đích, rồi `Cần nêu:\n` kèm 2-4 gạch `- ...`, rồi đúng một cặp `Không đạt: "..."\nĐạt: "..."`. Giữ nguyên chữ `Không đạt:`/`Đạt:` vì `LandingQuestionCards.tsx:34-36` parse chúng.
   - `suggested_actions`: đúng một mục tự kiểm.
   - Ví dụ dùng dự án chạy xuyên suốt của CP3 (đặt bàn học nhóm quanh trường). Không ví dụ Nexus/ChatGPT; không chữ "CP2/CP3/Checkpoint", "gọi vốn" (dùng "nguồn vốn"), "tab Tài chính", "syllabus".
2. **Bảng câu hỏi** (id đầy đủ có tiền tố `pitch_`; nguồn cũ ở `questions-cp4.ts`, đọc nội dung cũ rồi viết lại theo chuẩn):

| Phase (id: tiêu đề) | Câu | classification | Ghi chú nội dung |
|---|---|---|---|
| `intro`: 1. Giới thiệu | `pitch_vision_mission` | required | từ `cp4_vision_mission`; tên dự án lấy từ tên case, không hỏi lại |
| `problem`: 2. Vấn đề | `pitch_pmf_problem` | required | bỏ chữ "CP2"; nêu rõ khách hàng mục tiêu |
| `solution`: 3. Giải pháp | `pitch_pmf_solution_tech`, `pitch_pmf_usp`, `pitch_pmf_responsible_ai_legal` | required, required, recommended | solution_tech PHẢI nêu yếu tố công nghệ (gu hội đồng); responsible_ai nêu AI có trách nhiệm, đạo đức, pháp lý |
| `market`: 4. Thị trường | `pitch_pmf_market_size`, `pitch_pmf_competitors` | required | market_size PHẢI nêu cách tính bottom-up và khả năng scale-up |
| `business_model`: 5. Mô hình kinh doanh | `pitch_bm_canvas_summary`, MỚI `pitch_bm_revenue` | required | bỏ chữ "CP3"; revenue: nguồn thu chính và mức giá |
| `marketing`: 6. Tiếp thị và bán hàng | `pitch_op_marketing_4p` | required | thêm kế hoạch bán hàng (hướng dẫn demo pitching mục 6) |
| `finance`: 7. Tài chính | MỚI `pitch_finance_summary` | required | dòng tiền, doanh thu/chi phí/lợi nhuận theo kỳ, điểm hòa vốn; trỏ về file Excel P&L |
| `team`: 8. Đội ngũ | `pitch_team_profile`, `pitch_team_gap` | required, recommended | |
| `status_funds`: 9. Kết quả đạt được và nguồn vốn | `pitch_pmf_customer_validation`, `pitch_pmf_mvp_demo`, MỚI `pitch_capital_plan` | required, recommended, required | mvp_demo: clip 15-20 giây hoặc nói 30-45 giây, để link trong slide, phần thêm dành cho Q&A; capital_plan: nguồn vốn (vốn tự có, tái đầu tư lợi nhuận, vốn góp nhóm, nhà đầu tư), số tiền, vì sao, dùng vào đâu; nhóm không gọi vốn vẫn trả lời |
| `ask`: 10. Kêu gọi hành động | MỚI `pitch_ask` | required | nhu cầu vốn hoặc hỗ trợ cụ thể, số tiền, mục đích |
| `elevator`: Phụ lục A. Elevator pitch 60 giây | `pitch_who`, `pitch_problem_solution`, `pitch_call_to_action` | recommended | nhóm tự biên tập từ mục 1-10: nêu cấu trúc ai, vấn đề, bằng cách nào, kêu gọi; trỏ tên mục nguồn; "không cần định giá, khảo sát, persona" |
| `extra`: Phụ lục B. Bổ sung cho bài nộp | `pitch_op_roadmap`, `pitch_op_risks` | recommended | |
| `qa`: Phụ lục C. Chuẩn bị hỏi đáp | `pitch_qa_team`, `pitch_qa_market`, `pitch_qa_model`, `pitch_qa_operation`, `pitch_qa_funding` | supplemental | MỚI, 5 câu, xem dưới |

   Tất cả phase `unlock_requires: []`. Tổng 27 câu (18 chuyển + 4 mới + 5 Q&A).
3. **5 câu Q&A** (bản nháp, user duyệt chữ cuối; trung lập mọi loại dự án, không nhắc AI/ChatGPT): team: nhóm thiếu năng lực gì để đi tiếp sau môn học, ai ở lại làm. market: khách đang giải quyết vấn đề bằng cách nào (đối thủ, tự làm, không làm gì) và vì sao chuyển sang nhóm; rào cản nào khiến người khác khó làm giống; thị trường lớn thêm thế nào. model: ai trả tiền, bao nhiêu, bằng chứng nào cho thấy họ sẽ trả. operation: rủi ro lớn nhất trong 12 tháng, xảy ra thì làm gì. funding: vì sao cần số tiền này (hoặc vì sao không cần), nguồn vốn từ đâu, dòng tiền âm kéo dài bao lâu.
4. **`catalogs/pitch.ts` (mới)** — `export const pitch: Template = { template_key: "pitch", title: "Pitch deck", description: "Nội dung bài pitch 10 mục, elevator pitch và chuẩn bị hỏi đáp.", phases: [...] }` theo bảng. `title` đi vào tên file docx (`Pitch_deck`) và thẻ gallery.
5. **`catalogs/questions.ts`** — thêm `...PITCH_QUESTIONS` vào spread (`:19-24`). **`catalogs/index.ts`** — import, export `pitch`, thêm vào `TEMPLATE_REGISTRY` (`:22`), bump `CATALOG_VERSION` (`:33`) thành `"2026-10-25.1"`.
6. **`catalogs/sync-rules.ts`** — thêm `pitch` (nguồn đầu không rỗng thắng, sao nguyên văn; dùng id đầy đủ): `pitch_team_profile` <- `cp1_team_members`, team; `pitch_pmf_problem` <- `cp2_problem_need`, `cp1_main_problem`, idea problem; `pitch_pmf_solution_tech` <- `cp2_solution`, `cp1_solution_description`, idea solution; `pitch_pmf_market_size` <- `cp2_tam_sam_som`; `pitch_pmf_customer_validation` <- `cp2_pmf_signals`; `pitch_pmf_competitors` <- `cp2_competitive_analysis`; `pitch_pmf_usp` <- `cp3_bmc_value_proposition`; `pitch_bm_revenue` <- `cp4_bm_revenue_streams`, `cp3_bmc_revenue_streams`, `cp1_revenue_model`; `pitch_op_marketing_4p` <- `cp2_marketing_4p`; `pitch_op_roadmap` <- `cp3_future_development`; `pitch_finance_summary` <- `cp4_op_break_even`, `cp4_op_sustainability`; `pitch_capital_plan` <- `cp4_fund_path`; `pitch_ask` <- `cp4_fund_ask`; `pitch_problem_solution` <- `pitch_pmf_problem` (chỉ có tác dụng khi câu nguồn đã lưu). Không có nguồn, nhóm tự viết: vision_mission, team_gap, bm_canvas_summary, mvp_demo, responsible_ai_legal, op_risks, who, call_to_action, 5 câu Q&A.
7. **`packages/shared/src/stages.ts`** — thêm `{ code: "PITCH", slug: "pitch-deck", name: "Pitch deck", serviceType: null, templateKey: "pitch", available: false }` (còn khóa để người dùng chưa thấy; phase 3 bật). Cần để `stage-summaries.test.ts:28-33` (mọi id phải mang tiền tố một stage) qua.
8. **Test** (`packages/validation/src/__tests__/`): `catalog-validation.test.ts` thêm import `pitch` và `validateCatalog(pitch)`; thêm một test bất biến "không câu hỏi nào thuộc hai template" (bảo vệ việc đổi tên id); `sync-rules.test.ts` thêm: `pitch_bm_revenue` rơi cp4 -> cp3 -> cp1; `pitch_problem_solution` sao câu `pitch_pmf_problem` đã lưu và bỏ qua khi chưa lưu. Test sinh sẵn của `sync-rules.test.ts:26-42` tự bắt id sai chính tả.

## Kiểm sau khi code

`cd packages/validation && bun run build && bun run test`; `bun run check-types` (validation); `cd apps/api && env -u LOG_LEVEL timeout 40 npx tsx --test src/shared/infrastructure/tests/stage-summaries.test.ts`; `npx tsc --noEmit` (API và `apps/web-1` bằng `bun run check-types`, vì `TemplateKey` đổi).

## Acceptance

`TEMPLATE_REGISTRY` có `pitch` với đúng 27 câu hợp lệ; `validateCatalog` không ném; `sync-rules` và `stage-summaries` xanh; `cp4` chưa đổi; stage `PITCH` còn `available: false`; mọi câu theo chuẩn CP3 và không chứa chữ cấm.
