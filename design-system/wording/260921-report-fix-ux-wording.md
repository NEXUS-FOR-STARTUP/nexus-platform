# BÁO CÁO ĐỊNH HƯỚNG UX WORDING OVERHAUL

## Nexus Platform

> **Nguồn trao đổi định hướng:** https://chatgpt.com/share/6ab0cc93-6130-83ec-8f90-a0bc756ba8d0

## I. Mục tiêu của đợt sửa

Mục tiêu của đợt này không phải đơn thuần là làm câu chữ “hay hơn”, “chuyên nghiệp hơn” hay “marketing hơn”.

Mục tiêu tối thượng là:

**Giảm số lần người dùng phải tự suy nghĩ để hiểu hệ thống đang nói gì, mình đang ở đâu, mình đang làm gì và nên làm gì tiếp theo.**

Toàn bộ wording mới phải phục vụ bốn câu hỏi:

1. Tôi đang ở đâu?
2. Hệ thống đang làm gì?
3. Điều này có ý nghĩa gì với nhóm của tôi?
4. Tôi cần làm gì tiếp theo?

Nếu một câu chữ nghe hay nhưng làm bốn câu hỏi trên khó trả lời hơn, câu đó là UX copy kém.

---

# II. Phạm vi của đợt sửa hiện tại

Đợt này tập trung vào:

- Landing Page.
- Authentication.
- Team Fit.
- Dashboard.
- Intake.
- Upload tài liệu.
- Mua lượt đánh giá.
- Ví và thanh toán.
- Trang dự án.
- Trạng thái xử lý.
- Báo cáo đánh giá.
- Phiên bản và đánh giá lại.
- Error.
- Empty state.
- Toast.
- FAQ.
- Contact.
- Privacy/Terms ở mức sửa những claim rõ ràng đang không đúng hoặc quá mạnh.
- Student-facing terminology nói chung.

Đợt này **chưa cần sửa methodology/prompt AI bên dưới**, mặc dù engine hiện vẫn chứa nhiều phụ thuộc vào FPT, EXE101 và CP1.

Lý do:

- Dependency này chủ yếu nằm bên dưới hệ thống.
- Người dùng thông thường không nhìn thấy.
- Việc sửa tương đối độc lập với UI wording.
- Giá trị UX trước mắt cao hơn nếu tập trung sửa toàn bộ lớp giao tiếp của sản phẩm.
- Methodology có thể generalize trong một task riêng sau.

Tuy nhiên, UI mới tuyệt đối không tiếp tục quảng bá Nexus như một công cụ chính thức dành cho CP1/FPT.

---

# III. Định vị sản phẩm mới

Nexus không nên được định vị là:

> Công cụ AI chấm bài sinh viên.

Cũng không nên là:

> Công cụ giúp sinh viên vượt Checkpoint 1.

Định vị phù hợp hơn:

**Nexus là hệ thống đánh giá và phản biện tự động dành cho các nhóm đang phát triển dự án ở giai đoạn ý tưởng.**

Nexus giúp nhóm:

- phát hiện những điểm chưa rõ;
- nhận ra các giả định chưa được kiểm chứng;
- phát hiện những khẳng định chưa có đủ bằng chứng;
- tìm các khoảng trống trong lập luận;
- xác định những vấn đề quan trọng cần xử lý trước;
- hiểu dự án đang thiếu gì để tiếp tục phát triển.

AI là công nghệ thực thi bên dưới.

**AI không phải value proposition trung tâm.**

Không nên bán:

> “AI của Nexus phản biện dự án của bạn.”

Nên bán:

> **“Nexus đưa dự án qua một quy trình đánh giá có cấu trúc.”**

Điểm khác biệt Nexus cần truyền đạt không phải:

> Nexus có AI.

Mà là:

> **Nexus biết cần kiểm tra điều gì.**

---

# IV. Đối tượng người dùng

Primary user hiện tại vẫn là sinh viên đang phát triển dự án khởi nghiệp theo nhóm.

Tuy nhiên UI không nên tự khóa mình vào:

- FPT University;
- EXE101;
- EXE201;
- CP1;
- Checkpoint 1;
- syllabus của một trường;
- rubric của một môn.

Mental model public nên rộng hơn:

> **Nhóm sinh viên đang phát triển một dự án ở giai đoạn ý tưởng.**

Người trực tiếp thao tác Nexus được xem là:

> **Người đại diện của nhóm.**

Không mặc định đó là:

- leader;
- founder;
- trưởng nhóm;
- người sở hữu cá nhân dự án.

Vì vậy wording ưu tiên:

> “nhóm của bạn”

thay vì quá thường xuyên dùng:

> “dự án của bạn”
> “bài của bạn”

Khi context không liên quan ownership thì vẫn có thể dùng “bạn” để câu tự nhiên.

---

# V. Product language system

Đây là vocabulary mặc định phải được sử dụng xuyên student-facing UI.

| Internal / cũ    | User-facing mới                             |
| ---------------- | ------------------------------------------- |
| Case             | Dự án                                       |
| Hồ sơ            | Hạn chế; ưu tiên Dự án                      |
| Project          | Dự án                                       |
| Idea             | Ý tưởng                                     |
| Lifecycle Unit   | Phiên bản                                   |
| v00 / v01 / v02  | Phiên bản 1 / 2 / 3                         |
| Document Record  | Tài liệu                                    |
| File             | Tệp hoặc tài liệu tùy context               |
| Credit           | Lượt đánh giá                               |
| Audit            | Đánh giá                                    |
| AI Audit         | Đánh giá tự động                            |
| OMP Audit        | Không expose                                |
| Evaluation       | Lần đánh giá                                |
| Report           | Báo cáo đánh giá                            |
| Supporter        | Internal only                               |
| Mentor           | Chưa dùng cho service hiện tại              |
| AI Engine        | Không expose                                |
| Job              | Không expose                                |
| Queue            | Không expose                                |
| SLA              | Không expose                                |
| Admin assignment | Không expose                                |
| BLOCKER          | Phải đổi sang wording dễ hiểu               |
| MAJOR            | Phải đổi sang wording dễ hiểu               |
| MINOR            | Phải đổi sang wording dễ hiểu               |
| Checkpoint / CP1 | Không dùng làm định vị public               |
| Rubric           | Không dùng như nền tảng chính của Nexus     |
| Syllabus         | Bỏ                                          |
| Google Drive     | Bỏ                                          |
| Thẩm định        | Bỏ khỏi student UI                          |
| Kiểm định        | Bỏ khỏi student UI                          |
| Review           | Dịch sang tiếng Việt nếu không có lý do giữ |
| Copy             | Sao chép                                    |
| Click            | Hạn chế; nếu cần dùng “nhấn”                |

---

# VI. Phân biệt các thuật ngữ quan trọng

## 1. Dự án

Là object lớn nhất trong mental model của người dùng.

Dự án tồn tại xuyên nhiều lần chỉnh sửa và đánh giá.

Một dự án có thể chứa:

- thông tin nhóm;
- tài liệu;
- nhiều phiên bản;
- nhiều lần đánh giá;
- nhiều báo cáo.

Backend có thể tiếp tục gọi là `Case`.

User không cần biết điều đó.

---

## 2. Ý tưởng

Ý tưởng không phải object bằng Dự án.

Ý tưởng là nội dung cốt lõi mà nhóm đang phát triển bên trong dự án.

Ví dụ:

> “Kiểm tra nhanh ý tưởng của nhóm”

là đúng.

Nhưng:

> “Danh sách ý tưởng”

không nên được dùng nếu thực tế UI đang hiển thị danh sách Case/Dự án.

---

## 3. Tài liệu

Là các file nhóm tải lên để Nexus đánh giá.

Không gọi chúng là:

- hồ sơ;
- submission;
- input package;
- attachment set.

UI có thể dùng:

> Tải tài liệu

> Tài liệu của nhóm

> Chọn tệp

“File” không cần bị cấm tuyệt đối, nhưng không nên là business terminology chính.

---

## 4. Phiên bản

Mỗi lần nhóm cập nhật tài liệu là một phiên bản mới.

Không hiển thị:

> v00
> v01
> v02

nếu không có lý do kỹ thuật bắt buộc.

Nên dùng:

> Phiên bản 1
> Phiên bản 2
> Phiên bản 3

hoặc kết hợp ngày:

> Phiên bản 2 · 21/09/2026

---

## 5. Đánh giá

Đây là core action của Nexus.

“Đánh giá” là umbrella term.

Nexus:

> đánh giá dự án.

Trong quá trình đó Nexus:

> phản biện lập luận.

Vì vậy không cần chọn một trong hai.

Có thể hiểu:

**Đánh giá = process.**

**Phản biện = một phần giá trị của process.**

---

## 6. Lượt đánh giá

Đây là đơn vị user mua và sử dụng.

Backend hiện dùng Credit.

Quan hệ hiện tại:

> 1 credit = 1 lần chạy đánh giá.

Vì vậy student UI có thể bỏ hoàn toàn từ Credit.

Quan trọng:

**Gói 79.000đ hiện cấp 2 lượt đánh giá.**

Do đó wording hiện tại:

> 79.000 VND / lượt

là sai.

Nên chuyển thành:

> **79.000đ**

> **Bao gồm 2 lượt đánh giá**

Có thể bổ sung:

> Mỗi lượt dùng để đánh giá một phiên bản tài liệu.

Điều này đồng thời giải thích vì sao nhóm có 2 lượt:

**Lượt 1 → đánh giá → sửa → lượt 2 → đánh giá lại.**

Đây thậm chí có thể trở thành benefit của package.

---

# VII. Định vị Team Fit

Team Fit không phải core paid product.

Nó là:

**Free preview / surface scan.**

Mục tiêu:

1. User thử cách Nexus suy nghĩ.
2. User cung cấp sơ bộ ý tưởng.
3. User cung cấp sơ bộ đội ngũ.
4. Nexus chỉ ra một số gap dễ thấy.
5. User nhận một giá trị nhỏ ngay lập tức.
6. Dữ liệu Team Fit được giữ lại.
7. User chuyển sang đánh giá đầy đủ.

Tên user-facing đề xuất:

> **Kiểm tra nhanh ý tưởng & đội ngũ**

Có thể giữ `Team Fit` như secondary branding nếu muốn:

> Kiểm tra nhanh ý tưởng & đội ngũ
> Team Fit

Nhưng không nên bắt user hiểu `Team Fit` trước mới hiểu feature.

Mô tả:

> **Mô tả ngắn ý tưởng và các thành viên trong nhóm. Nexus sẽ chỉ ra những điểm còn chưa rõ trong ý tưởng và những năng lực nhóm có thể đang thiếu để triển khai.**

Không hứa:

- phân tích sâu;
- đánh giá toàn diện;
- xác định chính xác độ phù hợp;
- xếp hạng thành viên.

Team Fit hiện chỉ trả surface gaps.

Điều đó phù hợp với vai trò free preview.

---

# VIII. Funnel UX nên được kể như thế nào

Flow free:

**Landing**

→ **Kiểm tra nhanh miễn phí**

→ Auth nếu cần

→ **Ý tưởng + đội ngũ**

→ **Kết quả sơ bộ**

→ Giải thích rằng đây là kiểm tra nhanh

→ **Đánh giá dự án**

→ Dùng lại context đã có

→ Upload tài liệu

→ Mua lượt đánh giá

→ Chạy đánh giá.

Flow paid trực tiếp:

**Landing**

→ **Đánh giá dự án**

→ Auth

→ Intake

→ Upload tài liệu

→ Mua lượt

→ **Bắt đầu đánh giá**

→ Chờ

→ Báo cáo

→ Sửa

→ Đánh giá phiên bản mới.

Hai flow này phải hội tụ về cùng mental model.

---

# IX. Landing Page cần thay đổi theo hướng nào

Landing hiện đang mắc nhiều lỗi:

- phụ thuộc CP1;
- nhắc rubric/syllabus;
- bán AI quá trực tiếp;
- nói Supporter/Mentor như capability hiện có;
- pricing sai về số lượt;
- mô tả Google Drive đã obsolete;
- Contact Form không hoạt động;
- claim `<1 phút` sai;
- terminology Audit/Checkpoint/Supporter/AI Engine quá nhiều.

Landing mới phải trả lời nhanh 5 câu:

### 1. Nexus giúp tôi việc gì?

> Giúp nhóm phát hiện điểm yếu trong dự án trước khi tiếp tục phát triển hoặc trình bày ý tưởng.

### 2. Nexus kiểm tra những gì?

Ví dụ:

- giả định;
- bằng chứng;
- vấn đề;
- khách hàng;
- giải pháp;
- tính khả thi;
- mô hình;
- lập luận.

### 3. Tôi nhận được gì?

> Báo cáo đánh giá có vấn đề cụ thể, vị trí trong tài liệu, mức độ ưu tiên và hướng xử lý.

### 4. Tôi phải làm gì?

> Upload tài liệu.

### 5. Chi phí thế nào?

> 79.000đ / gói
> 2 lượt đánh giá.

Landing không nên cố giải thích architecture AI.

---

# X. Premium / Mentor

Gói 149.000đ chưa phải sản phẩm public thực sự.

Hiện tại:

- UI disabled;
- workflow student chưa hoàn chỉnh;
- Supporter tồn tại;
- nhưng Supporter không có profile đủ để Nexus claim họ là mentor/chuyên gia/giảng viên;
- không có expertise matching;
- student chưa thể mua end-to-end.

Do đó:

**Không dùng Premium làm một phần value proposition chính.**

Phải bỏ các câu kiểu:

> Báo cáo được chỉnh sửa bởi giảng viên/mentor.

> Đồng hành cùng Supporter.

> Mentor FPT trực tiếp review.

Có hai lựa chọn UX:

### Ưu tiên:

Ẩn Premium khỏi Landing.

### Nếu muốn giữ roadmap:

Hiển thị rất nhẹ:

> **Đánh giá cùng chuyên gia**
> Sắp ra mắt

Không cần giá nếu chưa mở bán.

---

# XI. Trạng thái đánh giá

Backend có nhiều state:

- pending;
- queued;
- processing;
- completed;
- failed;
- cancelled.

Student không cần hiểu hết.

User-facing nên gom thành:

### 1. Sẵn sàng đánh giá

CTA:

> **Bắt đầu đánh giá**

### 2. Đang chờ xử lý

> **Đang chuẩn bị đánh giá**

### 3. Đang đánh giá

> **Nexus đang đánh giá tài liệu của nhóm bạn**

Mô tả:

> Kết quả thường có sau khoảng 10 phút.

### 4. Có kết quả

> **Báo cáo đã sẵn sàng**

CTA:

> **Xem báo cáo**

### 5. Thất bại

> **Đánh giá chưa hoàn tất**

> Có sự cố trong quá trình xử lý. Lượt đánh giá của nhóm đã được hoàn lại.

CTA:

> **Thử lại**

Không cần:

- worker;
- engine;
- queue;
- pipeline;
- job;
- processing stage nội bộ.

---

# XII. Thời gian xử lý

Không dùng:

> < 1 phút

Không promise:

> chắc chắn trong 10 phút.

Wording mặc định:

> **Kết quả thường có sau khoảng 10 phút.**

Hoặc:

> **Quá trình đánh giá thường mất khoảng 10 phút.**

User có thể rời page vì job chạy background.

Nhưng AI completion hiện không tạo notification.

Do đó không nói:

> Nexus sẽ thông báo khi hoàn tất.

Nên nói:

> **Bạn có thể quay lại dự án sau để kiểm tra kết quả.**

---

# XIII. Notification

Có notification infrastructure trong hệ thống nhưng AI evaluation completion hiện chưa nối với nó.

Vì vậy:

- không promise push notification;
- không promise in-app notification;
- không promise email;
- không viết “chúng tôi sẽ báo cho bạn”.

Human report publication có notification nhưng đây chưa phải current paid flow chính.

---

# XIV. Payment / Wallet

Backend flow khá phức tạp:

**VietQR → Ví → Order → CreditLedger → Evaluation**

Nhưng UX không được bắt user hiểu tất cả.

Mental model:

> **Bạn đang mua lượt đánh giá.**

Ví chỉ là payment mechanism.

Nếu user thiếu tiền:

> **Số dư chưa đủ**

> Bạn cần nạp thêm 79.000đ để mua gói 2 lượt đánh giá.

Sau khi mua:

> **Đã thêm 2 lượt đánh giá cho dự án**

Không:

> Đã cộng 2 credit.

User vẫn phải bấm:

> **Bắt đầu đánh giá**

sau khi có lượt.

Do đó không được nói:

> “Thanh toán thành công, Nexus đang đánh giá.”

trừ khi interaction sau này được đổi.

---

# XV. Report

Report là nơi có nhiều capability mạnh nhất của Nexus.

Wording nên tập trung vào capability thật:

### Nexus có thể:

- đánh giá tổng thể;
- đánh giá theo 5 nhóm tiêu chí;
- xác định lỗi theo mức độ;
- chỉ ra đoạn/slide liên quan;
- trích dẫn nội dung từ tài liệu;
- đưa ra câu hỏi bắt buộc cần trả lời;
- đưa ra action plan;
- nhận diện claim;
- nhận diện evidence;
- nhận diện assumption;
- phát hiện logical gap.

Landing và feature descriptions phải khai thác những fact này thay vì viết:

> AI thông minh.

> phản biện chuyên sâu.

> đánh giá toàn diện.

Ví dụ copy tốt hơn:

> **Chỉ ra những khẳng định chưa có đủ bằng chứng.**

> **Định vị nhận xét tại phần nội dung liên quan.**

> **Phân biệt vấn đề cần xử lý ngay và điểm chỉ nên cải thiện.**

> **Đưa ra các câu hỏi nhóm cần trả lời trước khi tiếp tục kiểm chứng ý tưởng.**

---

# XVI. Severity

Không expose trực tiếp:

- BLOCKER;
- MAJOR;
- MINOR.

Đề xuất user-facing:

### BLOCKER

**Cần xử lý trước**

Ý nghĩa:

> Vấn đề quan trọng có thể làm suy yếu đáng kể tính hợp lý của dự án.

### MAJOR

**Nên cải thiện**

Ý nghĩa:

> Điểm còn thiếu hoặc chưa đủ thuyết phục.

### MINOR

**Có thể hoàn thiện**

Ý nghĩa:

> Không phải vấn đề lớn nhưng cải thiện sẽ làm dự án rõ hơn.

Tên cuối cùng có thể tinh chỉnh trong lúc rewrite report UI.

Nguyên tắc là severity phải giúp user **ưu tiên hành động**, không phải hiểu taxonomy nội bộ.

---

# XVII. Error UX

Mọi error nên cố gắng trả lời:

1. Chuyện gì xảy ra?
2. Dữ liệu/tiền/lượt của tôi có an toàn không?
3. Tôi làm gì tiếp theo?

Ví dụ không tốt:

> Có lỗi xảy ra.

Tốt hơn:

> **Chưa thể bắt đầu đánh giá**

> Nexus chưa xử lý được tài liệu này. Hãy thử lại. Lượt đánh giá của nhóm chưa bị trừ.

Không expose:

- API key;
- Gemini;
- provider;
- Worker;
- Redis;
- HTTP status;
- Job ID;
- backend state;
- Session ID.

Trừ những màn hình admin/debug.

---

# XVIII. Toast

Không dùng pattern dư thừa:

> Thành công
> Cập nhật hồ sơ thành công!

Nên:

> **Đã cập nhật thông tin**

Hoặc:

> **Đã thêm 2 lượt đánh giá**

Toast phải nói kết quả thực tế.

Không cần generic title `Thành công` / `Lỗi` nếu nội dung đã đủ.

---

# XIX. Forms

Nguyên tắc:

- Label nói field là gì.
- Placeholder đưa ví dụ.
- Helper text giải thích requirement.
- Error nằm cạnh field.
- Toast chỉ dành cho lỗi hệ thống/toàn form.

Không dùng placeholder lặp label.

Ví dụ:

Label:

> Tên dự án

Placeholder:

> Ví dụ: Ứng dụng kết nối sinh viên tìm bạn cùng phòng

Thay vì:

> Tên dự án của bạn

---

# XX. Contact

Xóa Contact Form.

Không có backend nên form hiện tại tạo false affordance.

Contact section mới chỉ cần:

> **Cần hỗ trợ?**

> Liên hệ trực tiếp với Nexus qua email hoặc số điện thoại.

Sau đó:

- Email.
- Số điện thoại.

Facebook chỉ giữ nếu có fanpage thật và link đúng.

Không dùng link placeholder `facebook.com`.

---

# XXI. Privacy và các claim nhạy cảm

Đây là nhóm copy cần đặc biệt cẩn thận.

Không claim:

> Không chia sẻ với bên thứ ba.

Vì tài liệu có thể được gửi tới AI providers.

Không claim:

> Xóa dự án sẽ xóa vĩnh viễn mọi dữ liệu.

Vì file Cloudinary hiện không được cleanup.

Không claim:

> Dữ liệu không được dùng để train AI.

Hiện code chưa đủ để xác minh.

Không dùng:

> bảo mật tuyệt đối;
> bảo mật nghiêm ngặt;

nếu không giải thích rõ.

Copy Privacy nên mô tả fact thay vì slogan.

Ví dụ:

> Nexus sử dụng tài liệu bạn cung cấp để thực hiện quá trình đánh giá. Trong quá trình xử lý, nội dung có thể được truyền tới các nhà cung cấp công nghệ hỗ trợ việc phân tích.

Legal/privacy nên được audit riêng sau core product wording.

---

# XXII. Tone of voice

Nexus nên giống:

> **Một người phản biện giỏi, nói thẳng, rõ, hiểu startup và không làm màu.**

Không giống:

- văn bản hành chính;
- corporate sales;
- giảng viên chấm thi;
- AI chatbot;
- startup marketing hype.

Ưu tiên:

1. Dễ hiểu.
2. Chính xác.
3. Nhất quán.
4. Rõ hành động tiếp theo.
5. Ngắn.
6. Thân thiện.
7. Chuyên nghiệp.
8. Thuyết phục.

---

# XXIII. Các từ nên hạn chế

Không cấm tuyệt đối nhưng chỉ dùng khi thật sự có nghĩa:

- thông minh;
- chuyên sâu;
- tối ưu;
- đột phá;
- toàn diện;
- thực chiến;
- chuẩn;
- tiên tiến;
- mạnh mẽ.

Hạn chế:

> Vui lòng

nếu câu vẫn lịch sự khi bỏ.

Ví dụ:

> Vui lòng nhập tên dự án.

→

> Nhập tên dự án.

Hoặc tốt hơn là không cần instruction nếu label đủ rõ.

---

# XXIV. Những điều không cần sửa theo terminology user-facing

Backend/domain vẫn có thể giữ:

- Case;
- Credit;
- LifecycleUnit;
- AiJob;
- OMP audit;
- Checkpoint;
- Supporter;
- BLOCKER;
- SLA;
- CP1;
- internal enum.

Không cần refactor code chỉ để khớp wording.

Đợt này có thể thay presentation layer trước.

Đây là cách giảm phạm vi và rủi ro.

---

# XXV. Thứ tự rewrite

Không rewrite theo alphabet/file tree.

Phải rewrite theo user journey.

## Phase 1 — Core acquisition

1. Landing.
2. Pricing.
3. FAQ.
4. Contact.
5. Auth.

Mục tiêu:

User hiểu Nexus là gì trước khi đăng nhập.

---

## Phase 2 — Free funnel

6. Team Fit entry.
7. Team Fit input.
8. Team Fit loading/error.
9. Team Fit result.
10. CTA từ Team Fit sang paid.

Mục tiêu:

User nhận được một preview nhỏ nhưng thật và hiểu paid product sâu hơn ở đâu.

---

## Phase 3 — Paid conversion

11. Intake.
12. Document upload.
13. Package selection.
14. Wallet.
15. Deposit.
16. Purchase confirmation.

Mục tiêu:

User hiểu mình đang mua gì, bao nhiêu lượt và tiền đi đâu.

---

## Phase 4 — Core value

17. Trang dự án.
18. Evaluation states.
19. Retry.
20. Report.
21. Severity.
22. Action plan.
23. Citation.
24. Version history.
25. Resubmit.

Đây là phase quan trọng nhất đối với retention/value perception.

---

## Phase 5 — System polish

26. Empty states.
27. Toast.
28. Error.
29. Modal.
30. Confirmation.
31. Profile.
32. Settings.
33. Notifications.

---

## Phase 6 — Secondary/internal

34. Supporter.
35. Admin.
36. Legal/privacy.
37. Accessibility labels.
38. Miscellaneous.

---

# XXVI. Quy trình sửa từng flow

Mỗi flow nên trải qua 5 bước.

### Bước 1 — Reconstruct flow

Xác định:

> user vào từ đâu → muốn gì → làm gì → kết quả → bước tiếp theo.

### Bước 2 — Audit wording hiện tại

Mỗi string đánh giá:

- Có cần tồn tại không?
- Có nói đúng product không?
- Có dùng terminology chuẩn không?
- Có nói theo mental model của user không?
- Có lặp thông tin không?
- Có tạo false expectation không?

### Bước 3 — Sửa architecture trước câu chữ

Có trường hợp solution đúng là:

> xóa text.

Không phải:

> viết text đẹp hơn.

Ví dụ Contact Form nên xóa.

### Bước 4 — Rewrite

Viết copy mới theo language system.

### Bước 5 — Cross-flow consistency check

Kiểm tra các thuật ngữ:

- Dự án.
- Phiên bản.
- Lượt đánh giá.
- Báo cáo.
- Đánh giá.
- Tài liệu.
- Nhóm của bạn.

phải giữ cùng nghĩa xuyên hệ thống.

---

# XXVII. Những vấn đề không thể chữa bằng wording

Một vài UX debt đã phát hiện cần ghi lại nhưng không bắt buộc giải quyết trong task này:

1. Core methodology vẫn phụ thuộc FPT/EXE101/CP1.
2. Cloudinary files không được cleanup khi xóa dự án.
3. Premium chưa hoàn chỉnh.
4. Supporter chưa có credential/expertise model.
5. AI completion chưa phát notification.
6. Flow Wallet → Order → Credit khá phức tạp.
7. Team Fit chưa có deterministic skill-role matching.
8. Contact form chưa có backend.
9. Một số chat error chưa map đúng.
10. Privacy implementation và wording hiện chưa hoàn toàn khớp.

Trong wording overhaul:

- sửa những gì presentation layer có thể sửa;
- không mở rộng scope thành rebuild product;
- ghi technical debt lại riêng.

---

# XXVIII. Definition of Done cho đợt wording overhaul

Đợt sửa được xem là hoàn thành khi:

### Terminology

- Không còn `Credit` trên student UI.
- Không còn `Audit`.
- Không còn `Case`.
- Không còn `Supporter`.
- Không còn `AI Engine`.
- Không còn CP1/FPT như public positioning.
- Không còn Drive wording obsolete.

### Product accuracy

- 79.000đ hiển thị đúng là 2 lượt.
- Không claim Premium đang hoạt động.
- Không claim mentor review.
- Không claim <1 phút.
- Không promise AI notification.
- Không hiển thị Contact Form giả.
- Không có privacy claim vượt quá implementation.

### Flow clarity

Ở mỗi màn hình user đều biết:

- mình đang ở đâu;
- hệ thống đang làm gì;
- mình có cần làm gì không;
- hành động tiếp theo là gì.

### Tone

- Không developer-speak.
- Không corporate jargon.
- Không marketing hype.
- Không hành chính hóa.
- Không đổi từ đồng nghĩa vô nguyên tắc.

### CTA

CTA nói đúng kết quả sau click.

Ví dụ:

> Xem báo cáo
> Tải tài liệu
> Bắt đầu đánh giá
> Mua 2 lượt đánh giá
> Đánh giá phiên bản mới

thay vì:

> Tiếp tục
> Xác nhận
> Thực hiện
> Xử lý
> Submit

khi context không đủ rõ.

---

# XXIX. Kế hoạch execution đề xuất

Không cần thêm một vòng discovery lớn.

Bước tiếp theo là bắt đầu rewrite.

Thứ tự nên là:

**1. Landing + Pricing + FAQ + Contact**

để khóa public positioning.

Sau đó:

**2. Team Fit**

để khóa free funnel.

Sau đó:

**3. Intake + Payment**

để khóa conversion terminology.

Sau đó:

**4. Project + Evaluation + Report**

để khóa core product experience.

Sau đó:

**5. Toàn bộ màn hình phụ**

để làm consistency sweep.

Mỗi lần hoàn thành một flow cần cập nhật terminology/reference document để những flow sau không drift.

---

# XXX. Kết luận

Hiện tại đã có đủ ba loại thông tin cần thiết để thực hiện UX wording overhaul:

### 1. Product intent

Đã rõ Nexus muốn trở thành gì và không muốn bị định vị thành gì.

### 2. Technical reality

Đã biết backend thực sự hoạt động thế nào, đâu là feature thật, đâu là scaffold, đâu là wording lỗi thời.

### 3. UX language principles

Đã thống nhất mental model, terminology, tone và thứ tự ưu tiên.

Vì vậy hiện không còn lý do phải tiếp tục discovery trước khi bắt đầu rewrite.

Nguyên tắc trung tâm của toàn bộ đợt sửa là:

> **Nexus không cần nói cho người dùng biết hệ thống phức tạp như thế nào. Nexus cần làm cho việc hiểu dự án của chính họ trở nên đơn giản hơn.**

Mọi câu chữ mới nên được đánh giá dựa trên tiêu chuẩn đó.
