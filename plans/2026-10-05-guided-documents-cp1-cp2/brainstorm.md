# Brainstorm — Guided Documents (điền tài liệu qua template + Q&A) — ĐÃ CHỐT VỚI USER

> File này là **nguồn sự thật của phần business**, ghi lại nguyên ý đã chốt với user.
> Mọi plan / code phải khớp file này. Nếu plan lệch → **sửa plan, không sửa file này.**
> Chốt lại lần cuối: **2026-10-05** (sau khi user chỉ ra lệch ở cơ chế dependency cấp câu hỏi).

---

## 1. Vấn đề & tầm nhìn

- Người khởi nghiệp có **ý tưởng trong đầu, có câu trả lời, nhưng không biết viết lại thành tài liệu**.
- Thay vì bắt khách gửi tài liệu (mà họ chưa viết, chưa biết viết, chưa biết có nên viết không) →
  hệ thống **giúp khách viết luôn**: cung cấp template tài liệu → khách trả lời câu hỏi hệ thống đặt ra →
  hệ thống **tự viết vào tài liệu** → khách chỉ cần **tải về**.
- Đống tài liệu đó là **cơ sở chính** để phát triển tính năng **đánh giá phản biện** cho các checkpoint sau
  (CP2, CP3, CP4…).
- **Trả phí mở khoá template** = tầm nhìn dài hạn, **chưa làm ngay**.

---

## 2. Trải nghiệm trả lời câu hỏi — ĐÃ CHỐT (SỬA ngày 2026-10-05)

- Mỗi template có **1 nhóm câu hỏi riêng**.
- **ĐẨY RA HẾT TẤT CẢ CÂU HỎI THÀNH LIST** cho user xem — như **MỤC LỤC**.
- Câu trả lời xong → **tick xanh**.
- Câu chưa trả lời (nhưng không vướng dependence) → hiện là **"chưa hoàn thành"**, **VẪN MỞ ĐƯỢC**.
- Câu **chỉ bị mờ + khoá** khi: câu đó **có dependence buộc câu trước phải trả lời xong**, mà câu trước
  **chưa trả lời**.
  → Ẩn/hiện quyết định ở **CẤP ĐỘ CÂU HỎI** (dependence của từng câu), **KHÔNG phải cấp phase**.
  → "phase" chỉ là cách **gom nhóm để hiển thị** (như mục lục), **KHÔNG dùng phase để khoá/mở**.
- **Tự do chọn câu đang mở để trả lời trước, lưu dần.** KHÔNG ép thứ tự A→B→C, KHÔNG phải form tuần tự,
  KHÔNG phải chatbot.
- Mindset: như **"bổ sung thông tin cá nhân trên hệ thống"** — thấy mục nào cần hoàn thành, đã hoàn thành
  gì, còn gì chưa, rồi làm từ từ.

---

## 3. Các nút trên giao diện trả lời — ĐÃ CHỐT

- 2 nút bên dưới: **"Lưu nháp"** và **"Hoàn thành"**.
- **Lưu nháp** = lưu tạm, sau đó vào trả lời tiếp.
- **Hoàn thành** = lưu và đánh dấu câu này đã hoàn thành.
- **KHÔNG tự động. KHÔNG cần AI kiểm tra chất lượng.**

---

## 4. Phân loại độ quan trọng của câu hỏi — ĐÃ CHỐT (Q10, 2026-10-05)

- 3 mức: **"bắt buộc" / "khuyến nghị" / "bổ sung"** (bỏ 3 từ cũ "rất quan trọng / quan trọng / làm rõ").
- Mức bắt buộc thuộc về **từng template** (xem mục 7c), không gắn cố định vào câu hỏi.

---

## 5. Khi nào cho tạo tài liệu — ĐÃ CHỐT (Q11, 2026-10-05)

- **Trả lời TOÀN BỘ CÂU BẮT BUỘC (tier 1)** mới cho tạo tài liệu. Câu khuyến nghị/bổ sung thiếu chỉ cảnh báo, không chặn.
- **KHÔNG đồng bộ realtime** bản tài liệu khi đang trả lời.
  Tập trung trả lời xong các câu bắt buộc → rồi mới điền vào tài liệu template sau.
- Tạo tài liệu là **hành động chủ động của user** (bấm nút), hệ thống không tự tạo.

---

## 6. Cơ chế Q&A → tài liệu DOCX — ĐÃ CHỐT

- **KHÔNG phải** "mỗi câu hỏi = 1 heading rồi paste câu trả lời bên dưới".
- Cần **1 bước xử lý trung gian**: phân tích dữ liệu câu hỏi-trả lời → bullet, cắt, di chuyển vào
  **vị trí đúng**, nhưng **vẫn phải cố giữ nguyên văn** câu trả lời.
- Mức biên tập: **BIÊN TẬP NHẸ** (đã chốt) — chỉ sắp xếp lại, gộp trùng lặp, nhóm đoạn + bullet.
  **Giữ nguyên ý, con số, độ bất định, nguồn gốc. KHÔNG bịa thêm bằng chứng. KHÔNG tự ý hoà giải mâu thuẫn.**

---

## 7. Thông tin dự án vs input đánh giá — PHÂN BIỆT QUAN TRỌNG, ĐÃ CHỐT

- Câu hỏi-trả lời để build tài liệu = **"THÔNG TIN DỰ ÁN"**, thuộc **TOÀN BỘ quá trình khởi nghiệp**,
  **KHÔNG thuộc riêng checkpoint nào**. Lưu dài hạn, dùng chung cho mọi checkpoint.
- Còn những thứ như *"Nhóm đã sửa gì theo góp ý CP1?"*, *"Hạn nộp, yêu cầu giảng viên, bản slide nộp CP2"*
  = **INPUT để AI ĐÁNH GIÁ CỤ THỂ HƠN**, thuộc **từng checkpoint**. KHÔNG phải thông tin dự án lưu dài hạn
  vào document.
- → **Tách riêng 2 thứ này, không gộp chung.**

---

## 7c. Mức bắt buộc thuộc về template, không thuộc câu hỏi — ĐÃ CHỐT

- Câu hỏi và câu trả lời dùng chung trong dự án; **mỗi template quy định nhóm câu hỏi và mức bắt buộc riêng**.
- Trả lời một câu dùng chung thì được tính cho mọi template có dùng câu đó.
- Nói ngắn gọn: **trả lời một lần, dùng nhiều nơi; mỗi tài liệu có điều kiện tạo riêng.**

## 7d. Chỉ sửa câu trả lời, không sửa trực tiếp tài liệu — ĐÃ CHỐT

- Trên web **chỉ sửa câu trả lời**; tài liệu là bản xuất theo phiên bản, xem + tải về.
- Muốn sửa thông tin → quay về câu trả lời liên quan → tạo **phiên bản tài liệu mới**; bản cũ giữ nguyên.
- File Word tải về sửa tự do bên ngoài, nhưng không đồng bộ ngược vào hệ thống.

## 7e. Tải file để đánh giá tách khỏi nhập thông tin — ĐÃ CHỐT

- **Gửi file để phản biện** không thay đổi thông tin dự án.
- **Nhập thông tin từ file** là thao tác riêng: hệ thống đề xuất nội dung theo câu hỏi (kèm nguồn trong file),
  user chọn phần muốn nhận; nội dung được nhận lưu thành **nháp**, không tự tick hoàn thành, không ghi đè câu đã có.

## 7f. Sửa câu đầu vào thì câu phụ thuộc bị đánh dấu xem lại — ĐÃ CHỐT

- Không xoá nội dung, không tự bỏ tick câu phụ thuộc; gắn nhãn **"Cần xem lại"**.
- User mở ra sửa hoặc xác nhận "Vẫn phù hợp"; nếu là câu bắt buộc thì phải xác nhận lại trước khi tạo tài liệu mới.
- Chỉ áp dụng với quan hệ phụ thuộc đã cấu hình, không đoán bằng AI.

## 7g. Đánh giá gắn với đúng phiên bản được gửi — ĐÃ CHỐT (Q12, 2026-10-05)

- Báo cáo phản biện luôn ghi phiên bản tài liệu đã đánh giá; tạo version mới không đổi báo cáo cũ.
- Muốn đánh giá bản mới thì gửi lượt mới (có thể liên kết với báo cáo trước để kiểm tra điểm đã sửa).

## 8. Lõi sản phẩm & hướng mở rộng

- Lõi: làm **TEMPLATE DOCUMENT** trước, dựa vào đó làm **ĐÁNH GIÁ PHẢN BIỆN** cho các checkpoint sau.
- **Mỗi checkpoint = 1 LOẠI PROMPT RIÊNG** để đánh giá.
- Template hiện có: **CP1** (ý tưởng, nguồn `TEMPLATE_STARTUP_CHECKPOINT1_V2.docx`) + **CP2**
  (nghiên cứu thị trường, nguồn rubric). **CP3, CP4 chưa có rubric → để sau.**
- CP1 soạn từ file DOCX có sẵn: tách heading thành câu hỏi + giải thích + hành động gợi ý, gộp thông tin trùng,
  tóm tắt lấy từ câu đã có (không bắt nhập lại).
- Template và câu hỏi hiện **soạn trong code** (catalog-as-code) để chạy CP1–CP2 trước (Q5 = C).
  **Template Builder (admin UI + DB) là đích về sau** (Q5 hướng tới B) — lúc đó mới khoá template trả phí được.
- "Hệ thống tự viết tài liệu" = **merge trước, AI polish sau** (Q6 = C): điền câu trả lời vào khung DOCX chạy được
  trước; lớp AI viết lại là giá trị gia tăng gắn sau.
- Trả phí (mua template / subscription) **để sau** khi lõi chạy (Q8 = C).
- Giữ **cả 2 luồng**, ưu tiên luồng guided Q&A trước, upload-import sau (Q9).

---

## 9. Nguyên tắc chung

- Mindset: cách nào **LÂU DÀI và ĐỠ RẮC RỐI** nhất về sau. **KHÔNG fix nhanh rồi để lại nợ rắc rối.**

---

## 10. XÁC NHẬN CUỐI (user chốt 2026-10-05 — không còn điểm mở)

1. **Phân loại câu hỏi (Q10)**: dùng "bắt buộc / khuyến nghị / bổ sung".
2. **Điều kiện tạo tài liệu (Q11)**: gate = tier 1 (chỉ câu bắt buộc).
3. **Đánh giá gắn version (Q12)**: giữ (user đồng ý ngầm).
