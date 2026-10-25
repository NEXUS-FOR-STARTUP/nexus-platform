# Brainstorm: CP3 và CP4 có giúp được khách không? Cái gì bỏ, cái gì thêm

Date: 2026-10-25. Status: chưa chốt, chờ user quyết 4 điểm ở mục 7. Không có code nào đã đổi.
Bổ sung cho `brainstorm-261025-cp4-finance-pitch-deck.md` (thiết kế CP4 + Pitch đã chốt trước đó); báo cáo này đề xuất sửa một phần quyết định số 5.2 của báo cáo đó.

## 1. Câu hỏi

User vào `?tab=journey&stage=tai-chinh&view=draft` thấy câu hỏi nhưng không thấy file Excel. Nếu khách chỉ cần Excel thì vào đây làm gì? Có làm thừa không? Thử: đưa Excel + hướng dẫn trong quote, bỏ hết câu hỏi?
Đồng thời hỏi CP3: đứng ở vai khách, CP3 và CP4 cần gì, cái gì thừa.

## 2. Sự thật đã kiểm (đọc code và tài liệu)

CP4:
- `stages.ts`: CP4 `serviceType: null`. `StageDraftOnly` -> `StageDraftView` -> `GuidedDocumentsEditor` với catalog `cp4`: 9 câu (5 bắt buộc, 4 tùy chọn `cp4_fund_*`), đầu ra docx.
- File Excel nằm ở `FILE_TEMPLATE_REGISTRY.finance` (`packages/validation/src/catalogs/file-templates.ts`), chỉ hiện trong `GuidedTemplateGallery`/`GuidedDocumentsWorkspace`. Stage `tai-chinh` không có nút tải. Đây là nguyên nhân user không thấy file.
- `TabFinance` (nhập P&L trong app) đã deprecated 2026-10-10 vì chuyển sang tải file giảng viên. Câu hỏi cp4 thuộc thiết kế cũ còn lại.
- `sync-rules.ts`: Pitch lấy `pitch_finance_summary` từ `cp4_op_break_even`/`cp4_op_sustainability`, `pitch_capital_plan` từ `cp4_fund_path`, `pitch_ask` từ `cp4_fund_ask`. Không thấy chỗ nào dùng `cp4_fund_use_of_funds` hay `cp4_fund_school_support`.
- Xlsx không đọc được trong pipeline hiện tại (`cp2-quote-verify.ts`: `text: null`).
- Đề giảng viên `EXE101/CP4/CP4 va PITCH DECK.pdf` (nguồn chính thức): nộp pitch deck PDF, Excel P&L only, Financial Sustainability Plan, Fundraising Plan (chỉ nộp nếu nhóm chọn Scalable và có nhu cầu gọi vốn; The Ask không bắt buộc). Nội dung P&L: A doanh thu có cơ sở từ TAM/SAM/SOM CP2 (công thức khách x tỷ lệ chuyển đổi x giá), B cấu trúc chi phí (COGS và vận hành; ghi "sweat equity" nếu làm không công), C điểm hòa vốn và lỗ lũy kế, D "làm sao sống sót những tháng đầu chưa có lãi". Gọi vốn là tùy chọn, Traditional được bỏ qua.

CP3:
- 20 câu: BMC 9, SWOT 4, chiến lược 4, kết luận 3 (`cp3_key_findings`, `cp3_business_feasibility`, `cp3_future_development`). 23 check audit (`cp3-audit-checks.ts`) chia 6 nhóm, tier gate/core/normal.
- Chỉ 3 câu cp3 được sync sang Pitch: `cp3_bmc_value_proposition`, `cp3_bmc_revenue_streams`, `cp3_future_development`. `cp3_key_findings` và `cp3_business_feasibility` không đi đâu cả.

## 3. Tài liệu chỉ là mẫu tham khảo, không phải rubric

`101_13_Nexus_CP4_Financial Sustainability Plan.pdf` là bài của nhóm Nexus. Cấu trúc 4.1-4.4 và mục sweat equity riêng là lựa chọn của nhóm, KHÔNG chứng minh là bắt buộc. Chỉ đề giảng viên mới có giá trị chuẩn.

Đã rút lại:
- "Summer A0A7 là lỗi file" sai. `pdftotext -layout` đọc đúng "Summer 2027". Lỗi nằm ở trình trích text lúc đầu.
- Đề xuất thêm câu "Sweat equity" và "Kết luận" bắt buộc rút lại; đề chỉ yêu cầu ghi chú sweat equity trong dòng nhân sự.
- "Bỏ hết câu hỏi" rút lại (xem mục 4).

## 4. Phân tích CP4

Vấn đề: bài nộp thật là Excel (số) + Sustainability Plan (lý do), nhưng stage chỉ cho phần chữ và không chỉ chỗ lấy Excel. Excel giữ số, chỉ văn bản giữ lý do (vì sao tăng quảng cáo, vì sao chấp nhận lỗ). Giảng viên chấm cả hai nên không bỏ được câu hỏi.

Đối chiếu đề với 9 câu hiện tại:

| Mục đề | Câu hiện có | Nhận xét |
|---|---|---|
| A doanh thu có cơ sở | `cp4_bm_revenue_streams`, `cp4_bm_unit_economics` | Chưa nối với TAM/SAM/SOM CP2 |
| B cấu trúc chi phí | `cp4_op_pl_assumptions` | Chưa rõ hint có nhắc ghi chú sweat equity |
| C hòa vốn | `cp4_op_break_even` | Khớp |
| D sinh tồn | `cp4_op_sustainability` | Khớp đúng câu hỏi của đề |
| Gọi vốn (tùy chọn) | `cp4_fund_path`, `cp4_fund_ask` | Nuôi `pitch_capital_plan`, `pitch_ask`; giữ, opt-in theo nhu cầu gọi vốn (đề: không bắt buộc, kể cả Scalable) |
| nhóm gọi vốn, không nuôi Pitch | `cp4_fund_use_of_funds`, `cp4_fund_school_support` | Không có sync sang Pitch. KHÔNG kết luận được là thừa: `use_of_funds` hữu ích cả với vốn tự góp (ví dụ trong hint `fund_ask`: 50 triệu do 4 thành viên góp); `school_support` dựa trên lời khẳng định trong hint ("theo quy định môn học"), quy chế chưa được xác minh. Chờ user quyết. |

Phương án đã xét:

| | Mô tả | Nhận xét |
|---|---|---|
| A | Excel + quote, 0 câu hỏi | Mất phần chữ bị chấm, phải sửa sync sang Pitch. Loại. |
| B | Excel trong stage + giữ câu hỏi bám đề, bỏ 2 câu thừa | Sửa đúng gốc lỗi, ít việc. Đề xuất. |
| C | Giữ nguyên, chỉ thêm link Excel | Vẫn có câu doanh thu/đơn giá/giả định nhập lặp với Excel. Chỉ vá triệu chứng. |

## 5. Phân tích CP3

CP3 khác CP4: có chấm AI thật, và phần chấm là giá trị lõi (BMC mâu thuẫn, SWOT thiếu số liệu và nguồn, chiến lược không truy ngược về SWOT). Bỏ câu hỏi ở CP3 là bỏ đối tượng bị chấm; không áp logic CP4 sang đây.

- Giữ: 9 ô BMC, 4 ô SWOT, 4 ô chiến lược, `cp3_future_development`.
- Bỏ `cp3_key_findings` (đã chốt): hint tự nói "mọi ý lấy lại từ BMC/SWOT, không thêm ý mới", tức chỉ là tóm tắt lại. Kéo theo bỏ check `c3_findings_grounded`. Giữ `cp3_business_feasibility` (chỉ có câu này hỏi "điều còn chưa chắc và cách kiểm chứng") và `cp3_future_development` (nuôi `pitch_op_roadmap`). Đảo một phần quyết định `ad8ca0e` ("chấm cả 20 câu": còn 19), user đã đồng ý.
- Gộp bớt check: có cặp chồng nhau (`c3_value_fits_pain` với `c3_usp_differentiated`; `c3_resources_to_activities` với `c3_activities_create_value`). Chưa kiểm bằng điểm thật.
- Thêm: sắp phản hồi theo `tier` (gate/core trước) thay vì 23 dòng đều nhau; hiển thị dữ liệu CP2 cạnh ô phân khúc/kênh (hiện `sync-rules` chỉ điền sẵn 2 ô cp3 từ CP1).
- Không thêm: điểm tổng, so sánh nhóm khác, SWOT tự sinh.

## 6. Phạm vi triển khai đã chốt (chưa làm, chờ lập plan)

Đã chốt (user, phiên này):
1. CP4 giữ câu hỏi; đưa Excel `finance` vào ngay stage `tai-chinh`.
2. Đề giảng viên là chuẩn; bài mẫu chỉ tham khảo.
3. Giữ cả 4 câu `cp4_fund_*`, tùy chọn. UI đã hiện nhãn "Tuỳ chọn" cho câu `supplemental` (`GuidedQuestionCard.tsx:14`) nên không cần thêm gì, không cần logic ẩn/hiện theo track hay theo nhu cầu gọi vốn.
4. Thêm một câu chọn Scalable/Traditional (mục 7).
5. CP3: bỏ `cp3_key_findings` + check `c3_findings_grounded`; giữ hai câu kết luận còn lại.
6. KHÔNG đối chiếu số giữa văn bản và Excel, không để hệ thống hoặc AI tự tính/chấm số tài chính. Khách tự lo file Excel. Nếu sau này cần kiểm số thì phải có người tham gia, không tự động.
7. DOCX luôn hiện đủ mọi câu. Câu tùy chọn (`classification: "supplemental"`) ghi nhãn "TUỲ CHỌN" viết hoa, để người đọc và agent hiểu có thể không cần trả lời. Câu tùy chọn để trống hiện "[TUỲ CHỌN: nhóm không trả lời]" thay cho "[Chưa có nội dung trả lời]". Chữ nhãn khớp "Tuỳ chọn" ở UI.

Việc làm:
- CP4-a: thẻ Excel (nút tải + quote `financeInstructions`) trong stage `tai-chinh`, trên khung câu hỏi.
- CP4-b: không cần làm. Đã đọc `questions-cp4.ts`: hint 4 câu A-D đã nêu số khách, tỷ lệ chuyển đổi, đơn giá, căn cứ thị trường, sweat equity và kịch bản xấu; khớp đề.
- CP4-c: câu chọn track (mục 7), loại câu mới đầu tiên không phải văn bản tự do.
- CP3-a: bỏ `cp3_key_findings` khỏi `cp3.ts`, `questions-cp3.ts`, `cp3-audit-checks.ts`, báo cáo hiển thị và prompt chấm; cập nhật test catalog.
- DOCX: sửa `docx-generator.ts` (heading câu hỏi, mục lục và dòng trả lời trống) theo quyết định 7. Generator dùng chung mọi template nên đổi này áp dụng cho cả cp1, cp2, cp3, cp4, pitch, không riêng CP4. Chưa kiểm test nào đang ghim chữ "[Chưa có nội dung trả lời]" hay đối chiếu heading.

Ý tưởng còn mở, chưa quyết (không nằm trong phạm vi trên): hiển thị TAM/SAM/SOM của CP2 cạnh câu doanh thu; sắp phản hồi CP3 theo `tier`; hiển thị dữ liệu CP2 trong stage CP3; gộp check audit chồng nhau (cần điểm case thật).

## 7. Câu chọn track Scalable/Traditional

Mục đích: ghi nhận cách phát triển dự án theo phân loại của đề (Scalable: công nghệ/nền tảng cần vốn để chiếm thị phần, có thể gọi vốn; Traditional: quán ăn, bán lẻ, dịch vụ nhỏ, chủ yếu vốn tự có, được bỏ qua gọi vốn). Không ẩn câu nào, không bắt buộc.

- Id: `cp4_fund_track`, đặt đầu nhóm "Nguồn vốn (tuỳ chọn)", `classification: "supplemental"`.
- Câu hỏi (bản nháp, cần user duyệt chữ): "Dự án của nhóm thuộc nhóm nào về cách phát triển?"
- Chọn một (radio), kèm giải thích ngay dưới mỗi lựa chọn:
  - "Phát triển nhanh (Scalable)": sản phẩm công nghệ hoặc nền tảng, cần đầu tư để chiếm thị phần nhanh, có thể gọi vốn từ nhà đầu tư.
  - "Phát triển vừa phải (Traditional)": quán ăn, bán lẻ, dịch vụ nhỏ, chủ yếu dùng vốn tự có.
  - "Khác": hiện ô nhập tự do để khách mô tả.
- Giải thích: nhóm Traditional được bỏ qua phần gọi vốn; không chọn cũng không sao.

Ràng buộc kỹ thuật (đã kiểm): `Question` trong `types.ts` chỉ có `text`, `explanation`, `suggested_actions`, `further_reading`. Mọi câu hiện tại là văn bản tự do; chưa có radio. `project_answers.answer_text` là `String @db.Text` (`prisma/schema.prisma:861`), nên không cần migration.

Thiết kế lưu (không lưu nhãn): thêm `options?: { value; label; description }[]` và `allow_other?: boolean` vào `Question` + `QuestionSchema`. Giá trị lưu là JSON có cấu trúc trong `answer_text`: `{"value":"scalable"|"traditional"|"other","otherText":string|null}`. Lý do: lưu nhãn thì sửa wording sẽ biến lựa chọn cũ thành "Khác"; lưu chuỗi "Khác" không phân biệt thì khách nhập đúng bằng nhãn có sẵn sẽ bị đổi lựa chọn khi tải lại. Giá trị `value` ổn định, chữ hiển thị nằm ở catalog.

Việc cần làm: schema parse/validate giá trị (value thuộc tập options; `other` bắt buộc có `otherText` không rỗng; value khác thì `otherText` null); component radio + ô nhập trong editor; `generate-docx.usecase.ts` format riêng thành chữ ("Phát triển nhanh (Scalable)" hoặc nội dung nhập) thay vì in JSON; kiểm `save-answers`, `get-answers`, cách đếm hoàn thành (câu `other` chưa có chữ có tính là chưa trả lời); `get-sync-proposals` sao nguyên văn nguồn nên không được dùng câu này làm nguồn sync (hiện không có rule nào dùng); cập nhật `validateCatalog`; thêm test cho parse/serialize và docx.


## 8. Chưa kiểm chứng

- Nội dung `docx-generator.ts`: docx CP4 hiện xuất cấu trúc nào, và khớp định dạng Sustainability Plan giảng viên chấp nhận hay không.
- Hint đầy đủ từng câu cp4 so với mục A-D.
- `FINANCE TEMPLATE.xlsx` so với `101_13_Nexus_CP4_P&L.xlsx` (nhóm sửa gì ở ô B33, C33); `financeInstructions` cảnh báo sheet mẫu có công thức sai ở các ô này.
- Mức chồng lấn thật giữa 23 check CP3 (cần điểm case thực).
- `pitch.ts`: các câu `pitch_finance_*` có bắt buộc không.
- Giảng viên chấm Sustainability Plan theo rubric nào (chưa thấy rubric riêng cho phần này).
