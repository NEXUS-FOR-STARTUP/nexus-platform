# Brainstorm: Tăng giá trị bản free "Kiểm tra nhanh ý tưởng & đội ngũ"

**Ngày:** 2026-09-23
**Người yêu cầu:** chủ dự án
**Kế hoạch chi tiết:** [`../260923-0037-team-fit-free-value-redesign/plan.md`](../260923-0037-team-fit-free-value-redesign/plan.md)

---

## 1. Câu hỏi

Mentor yêu cầu bản free trả thêm giá trị để khách tin. Bản free hiện tại hời hợt. Nên thêm gì vào phần kiểm tra đội ngũ?

Ràng buộc do chủ dự án chốt: **bản free phải có tính dẫn dắt sang gói trả phí.** Khách dùng free rồi không trả tiền là không chấp nhận được.

---

## 2. Sự thật đã kiểm chứng

| Điều | Bằng chứng |
|---|---|
| Bản free trả về `{ teamGaps: string[], commercialGaps: string[] }` | `packages/validation/src/index.ts:42-45` |
| Prompt bản free **cấm** khuyến nghị, điểm mạnh, dẫn chứng, mức độ, hành động | `evaluate-team-fit.usecase.ts:23-42` |
| Màn kết quả chỉ có 2 danh sách gạch đầu dòng | `TeamFitResultStep.tsx:85-113` |
| Trang bắt đăng nhập mới dùng được | `team-fit/page.tsx:23-29,61-63` |
| Báo cáo team-fit **được đưa vào** buổi audit trả tiền, nhưng chỉ khi `submissionType === "initial"`, và để thành file riêng `team_fit_report.md` | `omp-audit-coordinator.ts:246,250,254-281` |
| File bàn giao có mục 2 = nguyên kết quả AI của bản free | `omp-audit-coordinator.ts:270-273` |
| Bộ tiêu chí bản free viết cứng trong file TypeScript, một bộ chung cho mọi ngành | `evaluate-team-fit.usecase.ts:23-42` |
| Có sẵn cơ sở tri thức tích lũy nhưng bản free không dùng | `data/knowledge/startup_knowledge.db` — 6 bảng; `data/system-prompts/` |
| Chưa có chiều "ngành" cho vai trò đội ngũ | `evaluation_criteria.field_code` nhóm theo khía cạnh ý tưởng; `industry_benchmarks` chỉ có chỉ số tài chính, 3 ngành |
| Ô nhập liệu là chữ tự do, không đếm được | `TeamMemberCard.tsx:65-110` — `TextInput` + 2 `TagsInput`; nhãn "Chuyên ngành" nhưng ví dụ là chức danh |
| Lĩnh vực dự án là chữ tự do, giá trị lộn xộn | `IdeaMadLibsStep.tsx:16`; `_data/demo-preset.ts` |

---

## 3. Phát hiện quan trọng nhất

**Bản free đang không làm theo bản đặc tả mentor — chứ không phải "thiếu giá trị".**

`docs/nexus-document/cp3/feedback/02-cp3-mentor-team-assessment-guidance.md` nói rõ output bản free phải có 3 phần:

1. Kết luận sơ bộ (*"theo đánh giá sơ bộ ban đầu — thì là ổn"*)
2. Chia mảng ổn / yếu (*"Ổn về thiết kế sản phẩm, thiết kế MVP. Nhưng về mảng mô hình kinh doanh tài chính thì còn yếu hoặc hoàn toàn thiếu"*)
3. Đánh giá theo tương quan background ↔ lĩnh vực ↔ kỹ năng cần cho ngành

Cả ba đang thiếu. Đây là làm đúng đặc tả đã có, không phải phát minh tính năng.

---

## 4. Phát hiện thứ hai: bản free đang bỏ phí tài sản lớn nhất

Mentor nói moat nằm ở *"bộ prompt riêng cho những cái lĩnh vực riêng, các cái tiêu chí riêng và được tích lũy lại"* (`06-...md`).

Repo **đã có** cơ sở tri thức đó — `data/knowledge/startup_knowledge.db`, `generate_db.ts`, `data/system-prompts/`. Nhưng bản free chấm bằng một chuỗi prompt viết cứng, **một bộ tiêu chí chung cho mọi ngành**. Đúng thứ sinh viên copy rubric rồi paste vào ChatGPT là ra tương tự.

Chính `docs/flows/team-fit-flow.md` cũng tự ghi mục còn trống: *"Chưa khóa bộ câu hỏi team-fit theo từng tình huống dự án."*

---

## 5. Các hướng đã cân nhắc

### Hướng A — Thêm nhiều mục vào báo cáo (đã loại)

Thêm kết luận, chia mảng, dẫn chứng, câu hỏi phản biện. **Loại vì:** soi bằng bài kiểm tra của mentor thì phần lớn những mục này ChatGPT free làm được. Nó làm báo cáo dễ đọc hơn chứ không tạo moat.

### Hướng B — Chuyên biệt hóa theo ngành (đã chọn)

Bổ sung chiều "ngành" vào cơ sở tri thức: ngành này cần vai trò gì, câu hỏi phản biện riêng là gì. Bản free chấm dựa trên đó.

- Vượt bài kiểm tra ChatGPT: không có bộ tiêu chí theo ngành tích lũy thì không làm được
- Là lý do trả tiền theo đúng lời mentor
- Đóng luôn mục còn trống trong tài liệu luồng

### Hướng C — Gate theo số lượng thay vì cắt chất lượng (đã chọn, kết hợp với B)

Mentor tự cho phép giới hạn số lượng: *"đừng có tham, phải biết loại bớt… không phải vô hạn"* (`05-...md`). Nên dẫn dắt bằng **giới hạn lượng + dẫn sâu**, không phải cắt chất lượng.

### Hướng D — Máy tự đếm (đã chọn, có sửa)

Đếm chỉ số trực tiếp từ dữ liệu khách nhập: chi phí 0, không thể bịa, khách kiểm chứng được ngay.

**Đã sửa so với ý ban đầu:** không thể đếm trên dữ liệu hiện tại vì mọi ô đều là chữ tự do. Muốn đếm thật thì phải thêm **ô chọn bắt buộc** cho mỗi thành viên (`Kỹ thuật` / `Marketing` / `Kinh doanh – Tài chính`) và **danh mục ngành cố định** cho lĩnh vực dự án. Đây trở thành Phase 01 và là điều kiện tiên quyết.

---

## 6. Ranh giới đã chốt

> **Bản free chấm NGƯỜI. Gói trả tiền chấm BÀI.**

- Đội ngũ thiếu ai → free nói được, chỉ cần biết trong nhóm có ai
- Giải pháp / MVP / mô hình kinh doanh có tốt không → phải đọc tài liệu khách nộp

Ranh giới này có sẵn trong tự nhiên, không cần dựng tường giả.

Ba thứ để lại cho gói trả tiền, đúng theo lời mentor về lý do trả tiền:

| Không cho free | Nguồn |
|---|---|
| Cách sửa cụ thể | `06-...md`: *"gợi ý cả điểm cải thiện cụ thể"* |
| So sánh phiên bản trước/sau | `06-...md`: *"khả năng so sánh phiên bản này phiên bản trước"* |
| Chấm điểm tài liệu khách nộp | Toàn bộ gói trả tiền |

---

## 7. Quyết định về bàn giao sang audit trả tiền

Báo cáo team-fit **đang được đưa vào** buổi audit trả tiền, dưới dạng file riêng `team_fit_report.md`, chỉ với lần nộp đầu.

File đó có 3 phần; **phần 2 là nguyên kết quả AI của bản free**.

Sau khi bản free có thêm kết luận `needs_work`, phần 2 sẽ khiến người chấm buổi audit trả tiền đọc thấy kết luận **trước khi** đọc bài thật của khách → bản 79.000đ bị nhiễm định kiến sinh ra từ 6 ô mô tả.

**Quyết định: bỏ phần 2, giữ phần 1 và 3.**

Nguyên tắc: bản free nói cho khách biết, không nói cho người chấm biết.

---

## 8. Rủi ro

| # | Rủi ro | Xử lý |
|---|---|---|
| R1 | Dữ liệu cũ không có trường mới; `result_snapshot` cũ có dạng khác | Thay đổi cộng thêm, đọc được cả hai phiên bản, không sửa dữ liệu lịch sử. 5 nơi đang đọc `result_snapshot` |
| R2 | Nhiễm định kiến bản trả tiền | §7, có phase riêng verify |
| R3 | Máy đếm đoán sai vì đầu vào là chữ tự do | Phase 01 là điều kiện tiên quyết của Phase 04 |
| R4 | Ngành chưa có bộ tiêu chí → dùng bộ chung rồi giả vờ chuyên biệt | Bắt buộc nói thật, trả cờ `industryCriteriaAvailable: false` |
| R5 | Chi phí gọi AI không có trần | Giới hạn lượt + giới hạn tần suất (Phase 06) |
| R6 | Bộ tiêu chí viết cứng rồi FPT đổi rubric | Để trong DB, sinh bằng `generate_db.ts`, có `is_active` |
| R7 | Đổi ô nhập liệu làm học sinh đang dở phải nhập lại | Nháp đã lưu localStorage; dữ liệu cũ thiếu trường thì hiện ô chọn trống, không mất phần đã gõ |

---

## 9. Điểm cần người quyết định (không phải việc đi tìm)

**Tường đăng nhập.** Nút "Đánh giá đội ngũ" ở trang chủ → `/dashboard/team-fit` → bắt đăng nhập. Khách chưa có tài khoản không cảm nhận được giá trị free ngay lúc niềm tin đang hình thành.

Đây là đánh đổi kinh doanh: thu được thông tin liên hệ sớm, đổi lại chặn giá trị free đúng lúc cần nhất. Mở cho khách cần hạ tầng giới hạn tần suất làm trước, nếu không chi phí gọi AI không có trần.

Đợt này **giữ nguyên**, ghi lại để không bị bỏ quên.

---

## 10. Bước tiếp theo

Kế hoạch chi tiết 6 phase tại [`../260923-0037-team-fit-free-value-redesign/plan.md`](../260923-0037-team-fit-free-value-redesign/plan.md).
