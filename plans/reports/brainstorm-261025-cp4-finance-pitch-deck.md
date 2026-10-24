# Brainstorm: CP4 Tài chính + Pitch deck (demo pitching)

Date: 2026-10-25. Status: design agreed with user, chưa lập plan. Không có code nào đã đổi.

## 1. Vấn đề

- CP3 đã mở. CP4 chưa mở: `stages.ts` CP4 `serviceType: null`, `available: false`; gallery khóa `cp4` + file `finance` (`COMING_SOON_*`).
- Fall26 mới có hướng dẫn CP3. Chưa có hướng dẫn CP4 và demo pitching -> chưa có rubric chấm. Muốn phục vụ sớm các nhóm đi nhanh.
- Template `cp4` hiện trộn 27 câu tài chính + pitch.
- Nexus chỉ làm tài liệu docx (đơn vị cơ sở). Không làm slide hộ.

## 2. Nguồn đã đọc (Summer26, nhóm 13 Nexus, cô Hạnh)

- `docs/nexus-document/cp4/instructions/CP4 va PITCH DECK.md`: deliverable CP4 = pitch deck PDF, P&L Excel (P&L only), Financial Sustainability Plan, Fundraising Plan (chỉ nộp nếu Track Scalable). Flow 6 mục.
- `EXE101/CP4/BẢN PITCH DECK.pdf`: 28 slide, 7 phần (nộp CP4).
- `EXE101/DEMO PITCHING/HƯỚNG DẪN ... 30.7.2026.pdf`: nhóm Demo = 10 phút pitch + 10 phút Q&A, có chấm. Nhóm Finalist = elevator pitch 60 giây (ai -> vấn đề -> bằng cách nào -> kêu gọi), không Q&A, không chấm. Pitch deck 10 mục. Điều bắt buộc nhấn mạnh: yếu tố công nghệ (Giải pháp), scale-up (Thị trường), quy mô thị trường bottom-up.
- `gu chấm điểm.txt`: tư duy khởi nghiệp, công nghệ, AI có trách nhiệm, scale, trung thực, đạo đức + pháp lý.
- `rubric chấm điểm.txt`: 5 tiêu chí x 20đ (Team profile, PMF, Business Model, Business Operation, Fundraising), 6 mức. Là chữ trích từ ảnh, nguồn gốc chưa xác định tính chính thức. Chỉ dùng làm nhãn gợi ý.
- `Tham khảo chuẩn bị demo pitching.docx`: cô Hạnh soạn sau khi xem toàn bộ pitch deck các nhóm được chọn nộp lên. Mỗi nhóm: mạnh gì, yếu gì, nên sửa gì. Thang 4x25 (khác file rubric 5x20, chưa xác định tính chính thức). Nguồn tốt cho mẫu điểm yếu hay gặp.
- Transcript hướng dẫn trước pitching + pitching thử: MVP nói 30-45 giây hoặc clip 15-20 giây; nên quay clip; bỏ mở đầu dài; thêm Business Model Canvas; Fundraising không chỉ VC (bootstrapping, tái đầu tư, vốn nhóm) nhưng phải giải thích vì sao số tiền; chứng minh khả thi thương mại ở 201; TAM/SAM/SOM phải nhất quán.
- Chưa đọc: `13_Nexus_DemoPitching.pdf`, 2 deck 155MB, mp4, `NHÁP TÀI CHÍNH NEXUS.xlsx`, `Tham khảo (2).docx`, các xlsx CP4, `Nexus Document CP1-3.pdf`.

## 3. Ràng buộc từ code

- Test `stage-summaries`: mọi `question_id` phải bắt đầu bằng `<templateKey>_` của một stage -> Pitch deck cần key riêng `pitch`, id `pitch_*`, stage riêng.
- `generateDocxUseCase` tạo checkpoint theo `templateKey.toUpperCase()`, doc type `guided_<key>` -> template `pitch` sinh checkpoint `PITCH` (đã kiểm: cột không ràng buộc, xem 7.1; nhưng xem 7.4 về `current_checkpoint`).
- Finance tab trong app đã bỏ; `FINANCE TEMPLATE.xlsx` tải về, câu hướng dẫn nói Nexus không kiểm số liệu. `pl-validator.ts` có test nhưng chưa nối API/UI.
- `sync-rules.ts` đã điền sẵn CP2/CP3/CP4 từ câu hỏi CP trước. Doanh thu CP4: `cp4_bm_revenue_streams` <- `cp3_bmc_revenue_streams`, `cp1_revenue_model`.

## 4. Quyết định đã chốt với user

1. Pitching theo 10 mục mới (hướng dẫn demo pitching 30.7).
2. Thêm phase Chuẩn bị Q&A (5 câu cố định, không AI).
3. Elevator pitch 60 giây nằm chung Pitch deck, là phần phụ của nó. Kỳ nào cũng có nhóm finalist. Nhóm làm trong Pitch deck: được chọn demo pitching -> dùng 10 mục; chỉ được chọn finalist -> dùng phần elevator. Elevator là nội dung nhóm tự biên tập từ các mục 1-10 (hướng dẫn trong câu hỏi trỏ tới mục nguồn); hệ thống không tự tóm tắt.
4. CP4 mở tối thiểu, chỉ hỗ trợ phần tài chính. Pitch deck tách riêng.
5. Chưa chấm AI cho CP4 và Pitch deck, chờ hướng dẫn Fall26.
6. Không nối `pl-validator` (chưa có rubric nên khó nói "đúng").
7. Tên hiển thị: stage CP4 "Tài chính", stage mới "Pitch deck" (UI cấm CP1-CP4).
8. Doanh thu và giá chỉ hỏi ở CP4 Tài chính, điền sẵn từ CP3. Pitch deck có câu `pitch_bm_revenue` điền sẵn bằng cách sao nguyên văn từ đó (rơi về CP3 nếu CP4 chưa điền), nhóm chỉnh lại, không nhập từ đầu.

## 5. Thiết kế

### 5.1 Hai template

| | CP4 Tài chính | Pitch deck |
|---|---|---|
| Stage | CP4 (đã có) | stage thứ 5, mã `PITCH`, `serviceType: null`, `available: true` |
| Tiền tố | `cp4_*` | `pitch_*` |
| Chấm AI | chưa | chưa |

### 5.2 CP4 Tài chính (9 câu)

- Doanh thu và giá: `bm_revenue_streams`, `bm_unit_economics`.
- Giả định và sinh tồn: `op_pl_assumptions`, `op_break_even`, `op_sustainability`.
- Kế hoạch gọi vốn (tuỳ chọn theo Track, đổi chữ "gọi vốn" thành "nguồn vốn"): `fund_path`, `fund_ask`, `fund_use_of_funds`, `fund_school_support`.
- Thẻ file Excel P&L mở.

### 5.3 Pitch deck

Nhãn tiêu chí là gợi ý theo file rubric 5x20, chưa chính thức.

| Mục | Nội dung | Nhãn | Câu hỏi |
|---|---|---|---|
| 1 | Giới thiệu, tầm nhìn sứ mệnh | Team | `vision_mission` |
| 2 | Vấn đề, khách hàng mục tiêu | PMF | `pmf_problem` |
| 3 | Giải pháp, yếu tố công nghệ, USP, AI có trách nhiệm | PMF | `pmf_solution_tech`, `pmf_usp`, `pmf_responsible_ai_legal` |
| 4 | Thị trường bottom-up, scale-up, đối thủ | PMF | `pmf_market_size`, `pmf_competitors` |
| 5 | Mô hình kinh doanh | Business Model | `bm_canvas_summary` + MỚI `pitch_bm_revenue` (điền sẵn từ `cp4_bm_revenue_streams`, rơi về `cp3_bmc_revenue_streams`, rồi `cp1_revenue_model`) |
| 6 | Tiếp thị và bán hàng | Business Operation | `op_marketing_4p` |
| 7 | Tài chính | Business Operation | MỚI `pitch_finance_summary`: nhóm tự biên tập. Gợi ý bản nháp sao nguyên văn một nguồn (ưu tiên `cp4_op_break_even`, rồi `cp4_op_sustainability`); không tự tổng hợp nhiều mục |
| 8 | Đội ngũ | Team | `team_profile`, `team_gap` |
| 9 | Kết quả đạt được, nguồn vốn và dùng vốn (mọi nhóm, kể cả bootstrapping) | Fundraising | `pmf_customer_validation`, `pmf_mvp_demo`, MỚI `pitch_capital_plan` |
| 10 | Kêu gọi hành động | Fundraising | MỚI `pitch_ask` |
| Phụ A | Elevator pitch 60 giây (nhóm tự biên tập từ mục 1-10) | | `pitch_who`, `pitch_problem_solution`, `pitch_call_to_action`. Không điền sẵn tự động, chỉ hướng dẫn cấu trúc ai -> vấn đề -> bằng cách nào -> kêu gọi và trỏ tới mục nguồn. Tuỳ chọn: sao nguyên văn `pitch_pmf_problem` làm bản nháp cho `pitch_problem_solution` |
| Phụ B | Bổ sung (nộp CP4) | | `op_roadmap`, `op_risks` |
| Phụ C | Chuẩn bị Q&A | | 5 câu mới, xem 5.4 |

### 5.4 Chuẩn bị Q&A (5 câu cố định, bản nháp cần user duyệt chữ)

Một câu mỗi tiêu chí, viết trung lập cho mọi loại dự án (phần mềm, quần áo, đồ ăn, phần cứng), không giả định nhóm có dùng AI hay ChatGPT. Nguồn: transcript pitching thử và đánh giá cô gửi (điểm yếu lặp lại: thị trường nhỏ hoặc khó scale, rào cản gia nhập thấp nên dễ bị thay thế, đốt tiền quá lâu, rủi ro R&D phần cứng, bán bánh vẽ). Nhóm tự trả lời, đưa vào docx.

1. Team: nhóm thiếu năng lực gì để đi tiếp sau môn học, ai ở lại làm?
2. PMF: khách hiện đang giải quyết vấn đề này bằng cách nào (đối thủ, tự làm, không làm gì) và vì sao họ sẽ chuyển sang nhóm? Rào cản nào khiến người khác khó làm giống? Thị trường lớn thêm bằng cách nào?
3. Business Model: ai trả tiền, bao nhiêu, bằng chứng nào cho thấy họ sẽ trả?
4. Business Operation: rủi ro lớn nhất trong 12 tháng tới là gì, xảy ra thì làm gì?
5. Fundraising: vì sao cần số tiền này (hoặc vì sao không cần), nguồn vốn từ đâu, dòng tiền âm kéo dài bao lâu?

### 5.5 Liên kết 4 checkpoint

CP1 -> CP2 -> CP3 -> CP4 Tài chính -> Pitch deck. `sync-rules` sao nguyên văn nguồn đầu không rỗng từ CP trước vào câu tương ứng (CP1-CP3 -> Pitch deck, CP3 -> CP4); nhóm chỉnh lại. Không có chuỗi mở khoá. Chỗ cần rút gọn hoặc tổng hợp nhiều mục (elevator pitch, `pitch_finance_summary`) là nhóm tự viết. Nếu muốn hệ thống ghép nhiều nguồn thành bản nháp thì phải thiết kế thêm một loại nguồn `join` trong `sync-rules` (chưa nằm trong phạm vi này).

### 5.6 Thay đổi code

- `catalogs/cp4.ts` (9 câu), `catalogs/pitch.ts` mới, `catalogs/index.ts`.
- `questions-cp4.ts` (giữ 9), `questions-pitch.ts` mới (đổi `cp4_` -> `pitch_` cho các câu chuyển, thêm 4 câu mới `pitch_bm_revenue`, `pitch_finance_summary`, `pitch_capital_plan`, `pitch_ask` và 5 câu Q&A), `questions.ts`.
- `sync-rules.ts`: viết lại cp4, thêm pitch.
- `packages/shared/src/stages.ts`: CP4 `available: true`, thêm stage `PITCH`.
- `GuidedTemplateGallery.tsx`: bỏ `cp4` và `finance` khỏi `COMING_SOON_*`. Không thêm cp4/pitch vào `OPENABLE_TEMPLATES` (kiểu `AuditCheckpointCode`, không có audit CP4/PITCH; checkpoint tạo lười khi xuất docx).
- Web, stage không có `serviceType` (CP4, PITCH) mà `available: true`: `JourneyTab.tsx:39` và `StageHeader.tsx:44` hiện chữ "hết lượt chấm" (sai nghĩa), `StageBalanceCards.tsx:21` hiện thẻ số dư cho stage không mua được. Cần lọc `serviceType !== null` hoặc ẩn dòng này.
- `generate-docx.usecase.ts:43`: chỉ đặt `current_checkpoint` khi `targetCode === "CP1"` (xem 7, mục 4).
- Test: `catalog-validation.test.ts`, các test dùng `TEMPLATE_KEYS`, `stage-summaries.test.ts`.
- Không đụng: `pl-validator`, `audit-checkpoints.ts`, worker, prompt chấm.

## 6. Làm ngay / chờ Fall26

| Làm ngay | Chờ Fall26 |
|---|---|
| Tách template, stage Pitch deck, mở gallery CP4 + Excel P&L | Rubric và prompt chấm CP4 và Pitch deck |
| Điền sẵn bằng `sync-rules`, xuất docx | Chấm nhất quán chéo CP1-CP4 (TAM, giá, giả định P&L) |
| Phase Chuẩn bị Q&A, elevator pitch | Giá gói chấm CP4 |
| | Cấu trúc 10 mục / thời lượng / số tiêu chí có đổi không |

## 7. Kiểm chứng trước khi code (kết quả đã chạy ngày 2026-10-25)

1. `checkpoints.checkpoint_code` là `String`, unique `(case_id, checkpoint_code)`, không enum. Mã `PITCH`/`CP4` ghi được. `derive-stage-summaries` duyệt `STAGES` nên thêm stage tự có dòng tóm tắt; câu trả lời đếm theo tiền tố `<templateKey>_` nên `pitch_*` được đếm đúng.
2. DB `READONLY_DATABASE_URL` (container `nexus-db`, postgres 18.4, cổng 5432 trên máy này): 0 câu `cp4_*` trên 155 câu; checkpoints: CP1=16, CP2=4, không CP3. Đổi tên `cp4_` -> `pitch_` an toàn trên DB này. DB production không truy cập được từ máy này, nên chưa chứng minh prod cũng 0. Trước khi deploy phải chạy `select count(*) from project_answers where question_id like 'cp4\_%'` trên prod bằng guest account theo `docs/db-query-guide.md`.
3. `sync-rules` (`buildSyncProposals`): mỗi rule chỉ sao nguyên văn nguồn đầu tiên không rỗng, không ghép, không tóm tắt. `answers` là map mọi câu đã lưu của case nên tham chiếu được bất kỳ `question_id`, kể cả cùng template. Đây chỉ chứng minh sao chép nguyên văn được; chưa chứng minh tổng hợp được. Hệ quả: doanh thu ở Pitch deck cần câu riêng `pitch_bm_revenue`; elevator pitch và `pitch_finance_summary` là nội dung nhóm tự biên tập.
4. `generate-docx.usecase.ts:42-47` đặt `case.current_checkpoint = <mã template>` khi case chưa có, và `submit-intake.usecase.ts:51-56` dùng `current_checkpoint` đó làm checkpoint CP1. Nên docx xuất đầu tiên là CP2/CP3/CP4/PITCH sẽ làm intake CP1 tái dùng nhầm hàng checkpoint. Rủi ro có sẵn với CP2/CP3, thêm CP4/PITCH sẽ mở rộng. Sửa: chỉ đặt `current_checkpoint` khi mã là CP1.
5. ĐÃ SỬA (commit riêng): `OpenCheckpointParamsSchema` chỉ nhận `'CP2'` nên `POST /cases/:id/checkpoints/CP3/open` trả 400 và nút bắt đầu CP3 trong gallery báo lỗi. Đổi thành `z.enum(['CP2','CP3'])`, thêm test hồi quy `open-checkpoint-params.test.ts`. Chưa chạy luồng CP3 end-to-end qua HTTP và UI, chỉ chứng minh schema nhận CP3 và `openCheckpointUseCase` không phụ thuộc mã.
6. Docx sinh theo cặp câu hỏi và trả lời nên đầu ra vẫn dạng Q&A (đã lo ở lần brainstorm trước).
7. Hướng dẫn demo pitching là Summer26. Fall26 có thể đổi cấu trúc. Nội dung nằm trong file dữ liệu, sửa ít chỗ.
8. Nhãn tiêu chí dựa trên file rubric (chữ trích từ ảnh, chưa xác định tính chính thức); ghi trong câu hỏi là "gợi ý", không phải điểm.
9. Chữ 5 câu Q&A là bản nháp của mình, chưa ai duyệt.

## 8. Tiêu chí hoàn thành

- Gallery có thẻ CP4, Excel P&L, Pitch deck mở được; số câu và tiến độ đúng.
- Docx Pitch deck xuất được với 10 mục, elevator pitch, Q&A, đúng thứ tự.
- Điền sẵn đúng từ CP1-CP4; doanh thu không hỏi lại ở Pitch deck.
- `tsc`, `validation build + test`, test API đã đổi (từng file) xanh.
- UI không hiện "CP1-CP4"/"Checkpoint N".

## 9. Việc tiếp theo

- User duyệt báo cáo -> `/ck:plan` với báo cáo này làm ngữ cảnh. Các mục kiểm 7.1-7.5 đã xong; còn lại trước khi deploy: kiểm DB prod (7.2). Plan phase đầu: sửa `current_checkpoint` (7.4), rồi tách template.
