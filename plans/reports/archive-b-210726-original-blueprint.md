# BÁO CÁO THIẾT KẾ BUSINESS MODEL

## Nexus Platform — Package System & Customer Journey

Ngày: 21/07/2026 | Phiên bản: 2.0 | **Trạng thái: ARCHIVE — đã được thay thế bởi các plan chi tiết**

---

## Status Update (21/07/2026)

File này là blueprint gốc. Từ blueprint này, các plan đã được viết và quyết định được chốt. Dưới đây là trạng thái từng mục.

### Đã hoàn thành (Wave 1 + Wave 2b)

| Mục | Trạng thái | Plan |
|-----|-----------|------|
| §2.1 Free: Template mad libs 6 ô + team info | ✅ Đã implement: `IdeaMadLibsStep`, `TeamMemberCard` | Wave 1 |
| §2.1 Free output: 2 trục gaps, không giải thích | ✅ `TeamFitFreeReport` schema, AI prompt viết xong | Wave 1 Todo 4-6 |
| §2.1 CTA: "Muốn biết cụ thể..." | ✅ Hardcoded trên `TeamFitResultStep` | Wave 1 Todo 9 |
| §5 Bỏ Gói 0-3 cũ | ✅ Deactivated, seed 2 package mới | Wave 1 Todo 1 |
| §5 Wizard 9 bước → mad libs | ✅ Đã replace | Wave 1 |
| §5 Admin triage cho free | ✅ Free auto, không qua người | Wave 1 |
| Giá chốt: 39k/lượt | ✅ `pkg_tf_audit` price=39000 | Wave 1 Todo 1 |
| Bundle pricing (3/5 lượt) | ❌ **Không cần.** Pay-per-use model (Wave 2b) giải quyết luôn | Wave 2b |
| Engine đánh giá free | ✅ AI + team-fit engine | Wave 1 Todo 4-6 |
| Prompt AI cho free | ✅ `SYSTEM_PROMPT_FREE` | Wave 1 Todo 5 |
| Calibrate mức surface | ✅ Chờ QA thực tế sau Wave 1 | Wave 1 |
| Free không thêm field | ✅ Đã chốt: 6 ô + team, không thêm | — |

### Còn lại (chưa làm)

| Mục | Plan | Ghi chú |
|-----|------|---------|
| §2.2 Paid: 13 fields, 10 sections input | Supporter workflow (đã có) | Supporter tự chạy AI ngoài |
| §4 Supporter workflow: AI + verify + PDF upload | Đã có sẵn | `SupporterOutputUploadModal`, `submitSupporterOutputUploadUseCase` |
| §6 Customer journey sau khi mua lượt (notify, SLA, revision) | Wave 4 (SLA) + Notification plan | Chưa viết plan cho Notification |
| Farm: revision rounds | Wave 2b: **Bỏ revision miễn phí**, thay bằng "mua lượt mới" | Wave 2b đã plan |
| SLA timer | Wave 4 | Plan chưa viết |
| Admin analytics | Wave 4 | Plan chưa viết |

---

## 1. Tóm tắt

Thiết kế lại toàn bộ package system của Nexus Platform. Bỏ mô hình gói cố định (Gói 0–3 cũ), chuyển sang mô hình Free entry + Pay-per-use (mua lượt). Mỗi lượt audit/review giá 39–49k, không cam kết, không gói. Free tier là công cụ bán hàng — mục đích duy nhất là tạo tension và dẫn dắt sang lượt trả phí.

---

## 2. Cấu trúc package

### 2.1. Free — Kiểm tra nhanh

Mục đích: mồi vấn đề, dẫn dắt sang paid. Không phải sản phẩm độc lập.

Input: Template mad libs 6 ô + thông tin đội ngũ.

| Ô trống             | Câu dẫn                                            | Ví dụ                                       |
| ------------------- | -------------------------------------------------- | ------------------------------------------- |
| Tên dự án           | "Đặt tên gì cho dự án của bạn?"                    | LearnPath                                   |
| Lĩnh vực            | "Dự án thuộc lĩnh vực nào?"                        | EdTech                                      |
| Khách hàng mục tiêu | "Ai là người bạn muốn giúp? Càng cụ thể càng tốt." | Sinh viên năm 1-2 đại học                   |
| Vấn đề/nhu cầu      | "Họ đang gặp khó khăn gì?"                         | Không biết cách học hiệu quả                |
| Giải pháp           | "Bạn sẽ giúp họ bằng cách nào?"                    | App gợi ý lộ trình học cá nhân hóa          |
| MVP                 | "Phiên bản đầu tiên trông như thế nào?"            | Web app nhập môn học → nhận lộ trình 2 tuần |

Thông tin đội ngũ: số thành viên (tối đa 6), mỗi người khai chuyên ngành, sở trường, kinh nghiệm.

Auth: bắt buộc đăng nhập Google trước khi dùng. Mục đích ghi dấu vết khách hàng.

Output: đánh giá sơ bộ trên 2 trục.

Trục 1 — Team feasibility: đội ngũ có đủ kỹ năng để thực hiện ý tưởng này không. So khớp background thành viên với skill map của lĩnh vực. Chỉ ra thiếu gì, không giải thích hậu quả hay gợi ý sửa.

Trục 2 — Commercial viability: ở mức surface, dựa trên 6 ô đã có. Chỉ ra chỗ trống ("khách hàng còn rộng", "chưa rõ ai sẵn sàng trả tiền"), không khẳng định đúng sai, không giải thích tại sao.

Nguyên tắc: free không phán xét — free chỉ ra chỗ trống. Nói "có dấu hiệu chưa rõ ở khu vực X" thay vì "X sai". Không giải thích, không gợi ý, không giải quyết.

CTA cuối output: "Muốn biết cụ thể chỗ nào yếu, tại sao yếu, và sửa thế nào — mua 1 lượt audit (39k)."

### 2.2. Paid — Mua lượt audit/review

Mỗi lượt = audit toàn bộ ý tưởng. Không chẻ nhỏ theo khía cạnh.

Lý do không chẻ: prompt Input Clarification Gate Lite kiểm tra tính nhất quán xuyên suốt chuỗi logic customer → pain → current alternative → solution → MVP. Chẻ ra thì không thể đánh giá solution có khớp pain không, MVP có test đúng giả định nguy hiểm nhất không.

13 fields được kiểm tra: tên ý tưởng, khách hàng mục tiêu, customer story, pain point, current alternative, solution, value proposition, phân tách user/customer/payer/partner, evidence & assumptions, MVP & validation path, success metrics, team feasibility, market & business model. Trong đó 9 fields lõi, 1 field phụ.

Output chuẩn gồm 10 sections: kết luận nhanh, tóm tắt ý tưởng, bảng trạng thái field (phân loại theo 7 trạng thái từ Missing đến Good enough for CP1), blocker, major, minor, 8 câu hỏi bắt buộc, template viết lại input, phần để sang CP2, kết luận cuối.

Input của paid: cho phép upload tài liệu tự do (Drive link, mô tả dài, file PDF). User đã qua giai đoạn "không biết nói gì" — họ có output từ free, giờ cần audit sâu trên tài liệu thực.

Giá: 39–49k/lượt. Bundle optional (mua 3 lượt giảm giá, mua 5 lượt giảm thêm) — đây là giả thuyết, chưa validate.

---

## 3. Upsell bridge

Free nói "có vấn đề ở khu vực X" và dừng. Paid nói "vấn đề cụ thể là gì, tại sao nguy hiểm, hậu quả là gì, sửa thế nào".

Ví dụ với LearnPath:

Free nói về team: "Đội đủ kỹ năng xây sản phẩm và hiểu người học. Thiếu marketing." Dừng. Không nói thiếu marketing thì hậu quả gì, nên tìm ai.

Free nói về commercial: "Khách hàng còn rộng, chưa rõ ai sẵn sàng trả tiền." Dừng. Không nói tại sao rộng là vấn đề, nên phân khúc thế nào.

Paid nói thêm: "Customer 'sinh viên năm 1-2' — ngành nào, trường nào? Nếu không phân khúc, sản phẩm dành cho 'mọi người' và không ai thấy nó dành cho mình. Current alternative chưa nêu — sinh viên đang giải quyết bằng cách nào? MVP chưa test đúng giả định nguy hiểm nhất. Business model hoàn toàn thiếu: ai trả tiền, trả bao nhiêu, tại sao trả?"

Free càng ngắn, curiosity gap càng lớn, conversion càng cao. Free nói nhiều quá thì thành thay thế paid.

---

## 4. Supporter workflow

Supporter chạy AI bên ngoài theo quy trình viết sẵn trên Notion. System prompt lưu trong Drive nội bộ. Supporter bắt buộc chạy đúng prompt đã hướng dẫn, ra đúng format. AI làm toàn bộ phân tích và viết. Supporter chỉ verify và upload PDF lên platform.

Platform không tích hợp AI workflow vào web. Không có supporter workspace để viết báo cáo trên hệ thống. Platform chỉ làm: matching + payment + storage + display.

Hệ quả lên pricing: vì AI làm hết phần phân tích và viết, supporter chỉ verify (10–15 phút thay vì 30–60 phút), mức giá 39–49k sustainable.

---

## 5. Những gì đã bỏ

| Bỏ                                            | Lý do                                         |
| --------------------------------------------- | --------------------------------------------- |
| Gói 0 cũ (free case review qua wizard 9 bước) | Thay bằng template mad libs + auto assessment |
| Gói 1 (99k, 1 vòng)                           | Thay bằng mua lượt 39–49k                     |
| Gói 2 (199k, 2 vòng)                          | Bỏ, user mua thêm lượt nếu cần                |
| Gói 3 (399k, đồng hành nhiều vòng)            | Bỏ, đa số khách hàng không cần                |
| Wizard 9 bước cho free                        | Thay bằng template 6 ô + team info            |
| Admin triage cho free                         | Free xử lý tự động, không qua người           |
| Ô "ai trả tiền" riêng                         | Đã cover trong ô khách hàng mục tiêu          |

---

## 6. Những gì chưa quyết

| Vấn đề                                                             | Trạng thái                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Bundle pricing cụ thể (3 lượt, 5 lượt)                             | Giả thuyết, chưa validate                                    |
| Engine đánh giá free (skill map, keyword extraction, scoring)      | Chưa thiết kế chi tiết                                       |
| Prompt AI cho free assessment                                      | Chưa viết                                                    |
| Calibrate mức "surface" của commercial viability trong free        | Chưa test thực tế                                            |
| Free có cần thêm field nào ngoài 6 ô + team không                  | Đã chốt: không thêm                                          |
| Customer journey chi tiết sau khi mua lượt (notify, SLA, revision) | Chưa bàn — thuộc tầng operations, không phải business design |

---

## 7. Tóm tắt customer journey

Sinh viên vào platform → đăng nhập Google → điền template 6 ô + team info → nhận đánh giá sơ bộ (team fit + commercial viability ở mức surface) → đọc kết quả, thấy có chỗ trống → bấm CTA "Mua 1 lượt audit" → thanh toán 39–49k → upload tài liệu chi tiết → supporter chạy AI theo quy trình có sẵn, verify, upload PDF → sinh viên nhận báo cáo phân tích 13 fields → nếu chưa đủ, mua thêm lượt.
