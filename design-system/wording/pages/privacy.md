# Page: Chính sách bảo mật
Route: `/privacy`  
Access: `Public`

---

## Page Context

### User
- **Primary user:** Người dùng dịch vụ Nexus Platform (sinh viên làm đề án khởi nghiệp chuẩn bị bảo vệ Checkpoint 1, Supporter / Mentor học thuật, hoặc khách truy cập tìm hiểu quyền riêng tư).
- **Typical state:** Đang tìm hiểu chính sách bảo mật trước khi đăng ký tài khoản, nộp ý tưởng/tài liệu slide Google Drive, nạp tiền ví, hoặc muốn kiểm tra quyền của mình đối với dữ liệu cá nhân theo pháp luật Việt Nam.
- **Knowledge level:** Cần biết rõ dữ liệu ý tưởng, đề án khởi nghiệp, slide, log chat có bị rò rỉ, bị chia sẻ hay dùng để huấn luyện (train) mô hình AI công khai không; hiểu căn cứ pháp lý và thẩm quyền bảo vệ dữ liệu theo Nghị định 13/2023/NĐ-CP.

### User goals
- Tìm hiểu các loại dữ liệu cá nhân Nexus Platform thu thập (định danh, thanh toán, học thuật & dự án, kỹ thuật & tương tác).
- Xác minh cam kết bảo mật đối với dữ liệu ý tưởng đề án, bài làm và việc vô hiệu hóa huấn luyện AI công khai (OpenAI, Google Gemini).
- Biết rõ phương thức xử lý và lưu trữ dữ liệu thanh toán ví VND (không lưu số thẻ tín dụng hoặc mã CVV).
- Nắm rõ quyền của chủ thể dữ liệu: truy cập, chỉnh sửa, yêu cầu xóa tài khoản (quyền được lãng quên trong vòng 72 giờ), xuất bản sao dữ liệu.
- Biết kênh liên hệ chính thức của Nhân sự phụ trách Bảo vệ Dữ liệu (DPO) khi có thắc mắc hoặc yêu cầu xử lý dữ liệu.

### Business/Product goals
- Thiết lập tính minh bạch và độ tin cậy tuyệt đối về mặt pháp lý và bảo mật cho nền tảng đối với sinh viên và nhà trường.
- Tuân thủ đầy đủ khung pháp lý Việt Nam theo Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
- Minh định rõ ràng việc dữ liệu người dùng không bị bán và không dùng để train các mô hình AI công khai.
- Quy định rõ trách nhiệm và danh sách các bên thứ ba cung cấp dịch vụ hạ tầng (Sub-processors: Vercel AI SDK, OpenAI, Google Gemini, SePay, Centrifugo, Resend, Cloudinary, Supabase/PostgreSQL).

### Primary action
- Đọc nội dung chính sách bảo mật và điều hướng giữa 10 điều khoản qua thanh mục lục (Table of Contents) ở sidebar sticky (`#dieu-1-tong-quan` đến `#dieu-10-lien-he`).

### Secondary actions
- Bấm liên kết `Quay lại trang chủ` (`Link` dẫn về `/`).
- Gửi email yêu cầu hỗ trợ hoặc khiếu nại tới DPO qua `mailto:phungluuhoanglong@gmail.com`.
- Bấm nút `Đăng nhập` trên Header hoặc Mobile Drawer để tới trang `/auth`.
- Chuyển đổi giao diện Sáng/Tối qua `ThemeToggler`.
- Điều hướng sang các trang chính sách khác ở Footer (`/terms`, `/refund-policy`, `/fair-use-policy`).
- Mở trang Fanpage Facebook Nexus Platform qua icon link ở Footer.

### Entry
- Bấm liên kết `Chính sách bảo mật` từ Footer của bất kỳ trang nào sử dụng `AppShell` (nguồn: `apps/web-1/components/layout/AppShell.tsx:51`).
- Nhập trực tiếp URL `/privacy` trên trình duyệt.
- `[Assumption / Cần xác minh]` Nhấp vào liên kết điều khoản bảo vệ dữ liệu từ form đăng ký (`/auth`).

### Exit / next step
- Bấm `Quay lại trang chủ` → Chuyển hướng về `/` (nguồn: `apps/web-1/components/policy/PolicyDocumentLayout.tsx:80-86`).
- Bấm `Đăng nhập` → Chuyển hướng sang `/auth` (nguồn: `apps/web-1/components/layout/AppShell.tsx:77-85, 120-130`).
- Bấm email `phungluuhoanglong@gmail.com` → Mở ứng dụng gửi thư điện tử mặc định của thiết bị.
- Bấm các liên kết Footer → Chuyển sang `/terms`, `/refund-policy`, `/fair-use-policy`.

### Product facts / constraints
- Route `/privacy` là public route, không yêu cầu phiên đăng nhập và không bị chặn bởi middleware xác thực (nguồn: `apps/web-1/proxy.ts:122-131`).
- Tiêu đề tài liệu trên UI là `Chính sách Bảo vệ Dữ liệu Cá nhân`, metadata page là `Chính sách bảo mật | Nexus Platform` (nguồn: `apps/web-1/app/privacy/page.tsx:8, 29`).
- Phiên bản chính sách hiển thị trên UI: `2026-08-v2.0` (nguồn: `apps/web-1/app/privacy/page.tsx:32`).
- Ngày cập nhật lần cuối hiển thị: `30/08/2026` (nguồn: `apps/web-1/app/privacy/page.tsx:31`).
- Văn bản pháp lý nền tảng: Nghị định số 13/2023/NĐ-CP của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân, tham chiếu thêm tiêu chuẩn ISO/IEC 27001 và GDPR (nguồn: `apps/web-1/app/privacy/page.tsx:10, 30, 42`).
- Đơn vị chủ quản: "Hệ sinh thái Hỗ trợ Ý tưởng & Kiểm định Khởi nghiệp Sinh viên Nexus", DPO: "Ban Kỹ thuật & Pháp chế Nexus Platform" (nguồn: `apps/web-1/app/privacy/page.tsx:55-56`).
- Cam kết dữ liệu AI: Nền tảng đã thiết lập giới hạn API để vô hiệu hóa việc lưu trữ dữ liệu của người dùng nhằm mục đích huấn luyện (train) các mô hình AI công khai của các đối tác OpenAI, Google Gemini (nguồn: `apps/web-1/app/privacy/page.tsx:138`).
- Giới hạn thu thập dữ liệu thanh toán: Chỉ ghi nhận qua SePay webhook gồm lịch sử giao dịch ví VND, Reference ID, số dư khả dụng; tuyên bố rõ KHÔNG thu thập số thẻ tín dụng hoặc mã CVV (nguồn: `apps/web-1/app/privacy/page.tsx:87-89, 139`).
- Thời hạn cam kết xử lý: Xóa hoặc ẩn danh hóa toàn bộ thông tin định danh khi người dùng yêu cầu xóa tài khoản trong thời hạn không quá 72 giờ; thông báo vi phạm dữ liệu cho Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05) trong vòng 72 giờ (nguồn: `apps/web-1/app/privacy/page.tsx:173, 189`).
- Độ tuổi người dùng: Dịch vụ không cố ý thu thập dữ liệu người dưới 16 tuổi; người từ 7 đến dưới 16 tuổi cần có sự đồng ý giám sát của cha mẹ hoặc người giám hộ hợp pháp (nguồn: `apps/web-1/app/privacy/page.tsx:199-201`).
- Kênh liên hệ chính thức của DPO được niêm yết đồng nhất là `phungluuhoanglong@gmail.com` (nguồn: `apps/web-1/app/privacy/page.tsx:57, 213` và `apps/web-1/components/policy/PolicyDocumentLayout.tsx:148`).

---

## Interactive Inventory

### 1. Header & Navigation
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `header.logo` | `Logo` > `img[alt]` (Header desktop) | Alt text | `Nexus Logo` | `/` | default |
| `header.theme.toggle` | `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | `Toggle theme` | Chuyển đổi theme Sáng/Tối | default |
| `header.nav.login` | `Button` (Header desktop) | CTA | `Đăng nhập` | `/auth` | default |
| `header.mobile.burger` | `Burger` (Header mobile) | CTA | *(Icon Burger)* | Mở/đóng Drawer navigation trên mobile | default |
| `header.mobile.logo` | `Drawer` > `Logo` > `img[alt]` | Alt text | `Nexus Logo` | `/` | default |
| `header.mobile.login` | `Drawer` > `Button` (Mobile menu) | CTA | `Đăng nhập` | `/auth` | default |

---

### 2. Document Header & Navigation
*Source: `apps/web-1/components/policy/PolicyDocumentLayout.tsx` & `apps/web-1/app/privacy/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `doc.back_link` | `Link` (Quay lại trang chủ) | Navigation | `Quay lại trang chủ` | `/` | default |
| `doc.title` | `Title[order=1]` | Heading | `Chính sách Bảo vệ Dữ liệu Cá nhân` | — | default |
| `doc.subtitle` | `Text` | Description | `Chính sách này giải thích chi tiết cách Nexus Platform thu thập, xử lý, bảo vệ và chia sẻ thông tin cá nhân của bạn, tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP.` | — | default |
| `doc.meta.updated_label` | `span` | Label | `Cập nhật lần cuối:` | — | default |
| `doc.meta.updated_val` | `span > strong` | Item | `30/08/2026` | — | default |
| `doc.meta.version_label` | `span` | Label | `Phiên bản:` | — | default |
| `doc.meta.version_val` | `span > strong` | Item | `2026-08-v2.0` | — | default |

---

### 3. Sidebar Table of Contents & Support
*Source: `apps/web-1/components/policy/PolicyDocumentLayout.tsx` & `apps/web-1/app/privacy/page.tsx:privacyTOC`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sidebar.toc.title` | `aside > Text` | Heading | `Mục lục điều khoản` | — | default |
| `sidebar.toc.item_1` | `aside > nav > Anchor` | Navigation | `1. Tổng quan & Cam kết tuân thủ` | `#dieu-1-tong-quan` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_2` | `aside > nav > Anchor` | Navigation | `2. Bên Kiểm soát và Xử lý dữ liệu` | `#dieu-2-ben-kiem-soat` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_3` | `aside > nav > Anchor` | Navigation | `3. Dữ liệu cá nhân chúng tôi thu thập` | `#dieu-3-du-lieu-thu-thap` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_4` | `aside > nav > Anchor` | Navigation | `4. Căn cứ & Mục đích xử lý dữ liệu` | `#dieu-4-muc-dich-xu-ly` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_5` | `aside > nav > Anchor` | Navigation | `5. Chia sẻ dữ liệu & Bên thứ ba` | `#dieu-5-chia-se-du-lieu` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_6` | `aside > nav > Anchor` | Navigation | `6. Thời gian lưu trữ dữ liệu` | `#dieu-6-thoi-gian-luu-tru` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_7` | `aside > nav > Anchor` | Navigation | `7. Quyền của Chủ thể dữ liệu` | `#dieu-7-quyen-chu-the` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_8` | `aside > nav > Anchor` | Navigation | `8. Biện pháp bảo mật & Xử lý sự cố` | `#dieu-8-bao-mat` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_9` | `aside > nav > Anchor` | Navigation | `9. Quyền riêng tư của trẻ em` | `#dieu-9-quyen-tre-em` | scroll-to-anchor (smooth) |
| `sidebar.toc.item_10` | `aside > nav > Anchor` | Navigation | `10. Cập nhật chính sách & Liên hệ` | `#dieu-10-lien-he` | scroll-to-anchor (smooth) |
| `sidebar.support.prompt` | `aside > div > p` | Description | `Cần hỗ trợ về điều khoản?` | — | default |
| `sidebar.support.email` | `aside > div > a` | CTA | `phungluuhoanglong@gmail.com` | `mailto:phungluuhoanglong@gmail.com` | default |

---

### 4. Điều 1: Tổng quan & Cam kết tuân thủ
*Source: `apps/web-1/app/privacy/page.tsx:37-45`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu1.title` | `section#dieu-1-tong-quan > Title[order=2]` | Heading | `1. Tổng quan & Cam kết tuân thủ` | — | default |
| `privacy.dieu1.content` | `section#dieu-1-tong-quan > p` | Description | `Tại Nexus Platform, quyền riêng tư của bạn là ưu tiên hàng đầu. Chúng tôi cam kết xử lý Dữ liệu Cá nhân của bạn một cách an toàn, minh bạch và tuân thủ tuyệt đối các quy định của pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, đặc biệt là Nghị định 13/2023/NĐ-CP và các tiêu chuẩn bảo mật quốc tế (như ISO/IEC 27001 và GDPR, nơi áp dụng).` | — | default |

---

### 5. Điều 2: Bên Kiểm soát và Xử lý dữ liệu
*Source: `apps/web-1/app/privacy/page.tsx:47-60`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu2.title` | `section#dieu-2-ben-kiem-soat > Title[order=2]` | Heading | `2. Bên Kiểm soát và Xử lý dữ liệu` | — | default |
| `privacy.dieu2.intro` | `section#dieu-2-ben-kiem-soat > p` | Description | `Nền tảng Nexus Platform hoạt động với tư cách là Bên Kiểm soát và Xử lý dữ liệu đối với Dữ liệu Cá nhân mà bạn cung cấp trực tiếp cho chúng tôi:` | — | default |
| `privacy.dieu2.owner_label` | `section#dieu-2-ben-kiem-soat > div > p:nth-child(1) > strong` | Label | `Chủ quản nền tảng:` | — | default |
| `privacy.dieu2.owner_val` | `section#dieu-2-ben-kiem-soat > div > p:nth-child(1)` | Item | `Hệ sinh thái Hỗ trợ Ý tưởng & Kiểm định Khởi nghiệp Sinh viên Nexus` | — | default |
| `privacy.dieu2.dpo_label` | `section#dieu-2-ben-kiem-soat > div > p:nth-child(2) > strong` | Label | `Nhân sự phụ trách Bảo vệ Dữ liệu (DPO):` | — | default |
| `privacy.dieu2.dpo_val` | `section#dieu-2-ben-kiem-soat > div > p:nth-child(2)` | Item | `Ban Kỹ thuật & Pháp chế Nexus Platform` | — | default |
| `privacy.dieu2.contact_label` | `section#dieu-2-ben-kiem-soat > div > p:nth-child(3) > strong` | Label | `Kênh liên hệ chính thức:` | — | default |
| `privacy.dieu2.contact_val` | `section#dieu-2-ben-kiem-soat > div > p:nth-child(3)` | Item | `phungluuhoanglong@gmail.com` | — | default |

---

### 6. Điều 3: Dữ liệu Cá nhân Chúng tôi Thu thập
*Source: `apps/web-1/app/privacy/page.tsx:62-103`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu3.title` | `section#dieu-3-du-lieu-thu-thap > Title[order=2]` | Heading | `3. Dữ liệu Cá nhân Chúng tôi Thu thập` | — | default |
| `privacy.dieu3.intro` | `section#dieu-3-du-lieu-thu-thap > p` | Description | `Chúng tôi thu thập các loại dữ liệu cá nhân sau đây thông qua các tương tác của bạn với Hệ thống:` | — | default |
| `privacy.dieu3.th_category` | `table > thead > tr > th:nth-child(1)` | Heading | `Phân loại dữ liệu` | — | default |
| `privacy.dieu3.th_fields` | `table > thead > tr > th:nth-child(2)` | Heading | `Trường dữ liệu cụ thể` | — | default |
| `privacy.dieu3.th_method` | `table > thead > tr > th:nth-child(3)` | Heading | `Phương thức thu thập` | — | default |
| `privacy.dieu3.row1.category` | `table > tbody > tr:nth-child(1) > td:nth-child(1)` | Label | `3.1. Dữ liệu định danh` | — | default |
| `privacy.dieu3.row1.fields` | `table > tbody > tr:nth-child(1) > td:nth-child(2)` | Item | `Họ tên, Địa chỉ Email, Mật khẩu (mã hóa chuẩn quốc tế), Ảnh đại diện, Tên hiển thị công khai.` | — | default |
| `privacy.dieu3.row1.method` | `table > tbody > tr:nth-child(1) > td:nth-child(3)` | Item | `Bạn chủ động cung cấp khi tạo và quản lý tài khoản.` | — | default |
| `privacy.dieu3.row2.category` | `table > tbody > tr:nth-child(2) > td:nth-child(1)` | Label | `3.2. Dữ liệu thanh toán` | — | default |
| `privacy.dieu3.row2.fields` | `table > tbody > tr:nth-child(2) > td:nth-child(2)` | Item | `Lịch sử giao dịch ví VND, mã tham chiếu ngân hàng (Reference ID), số dư khả dụng. (Lưu ý: Chúng tôi KHÔNG thu thập số thẻ tín dụng hoặc mã CVV).` | — | default |
| `privacy.dieu3.row2.method` | `table > tbody > tr:nth-child(2) > td:nth-child(3)` | Item | `Ghi nhận thông qua API cổng thanh toán trung gian (SePay).` | — | default |
| `privacy.dieu3.row3.category` | `table > tbody > tr:nth-child(3) > td:nth-child(1)` | Label | `3.3. Dữ liệu học thuật & dự án` | — | default |
| `privacy.dieu3.row3.fields` | `table > tbody > tr:nth-child(3) > td:nth-child(2)` | Item | `Mô tả ý tưởng, tệp đính kèm (PDF, DOCX), log tin nhắn chat trực tiếp với Supporter, báo cáo đánh giá hệ thống.` | — | default |
| `privacy.dieu3.row3.method` | `table > tbody > tr:nth-child(3) > td:nth-child(3)` | Item | `Bạn chủ động nộp trong các Hồ sơ hỗ trợ (Case).` | — | default |
| `privacy.dieu3.row4.category` | `table > tbody > tr:nth-child(4) > td:nth-child(1)` | Label | `3.4. Dữ liệu kỹ thuật & Tương tác` | — | default |
| `privacy.dieu3.row4.fields` | `table > tbody > tr:nth-child(4) > td:nth-child(2)` | Item | `Địa chỉ IP, chuỗi User-Agent trình duyệt, hệ điều hành, thời gian truy cập, cookies phiên làm việc, lịch sử nhấp chuột (Telemetry).` | — | default |
| `privacy.dieu3.row4.method` | `table > tbody > tr:nth-child(4) > td:nth-child(3)` | Item | `Thu thập tự động bởi hệ thống máy chủ và các đoạn mã theo dõi tĩnh (Cookies) khi bạn duyệt web.` | — | default |

---

### 7. Điều 4: Mục đích & Căn cứ Pháp lý Xử lý Dữ liệu
*Source: `apps/web-1/app/privacy/page.tsx:105-127`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu4.title` | `section#dieu-4-muc-dich-xu-ly > Title[order=2]` | Heading | `4. Mục đích & Căn cứ Pháp lý Xử lý Dữ liệu` | — | default |
| `privacy.dieu4.intro` | `section#dieu-4-muc-dich-xu-ly > p` | Description | `Mọi hoạt động xử lý dữ liệu của chúng tôi đều tuân thủ nguyên tắc tính hợp pháp, dựa trên các căn cứ sau:` | — | default |
| `privacy.dieu4.consent_label` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(1) > strong` | Label | `Sự đồng ý rõ ràng (Consent):` | — | default |
| `privacy.dieu4.consent_desc` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(1)` | Description | `Thực hiện việc ghi nhận sự đồng ý bằng hành động khẳng định rõ ràng (đánh dấu vào ô check-box) khi đăng ký. Bạn có quyền rút lại sự đồng ý này bất cứ lúc nào.` | — | default |
| `privacy.dieu4.contract_label` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(2) > strong` | Label | `Thực hiện Hợp đồng (Contractual Necessity):` | — | default |
| `privacy.dieu4.contract_desc` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(2)` | Description | `Xử lý dữ liệu định danh, thanh toán và học thuật (Điều 3.1, 3.2, 3.3) là điều kiện bắt buộc để thực hiện các cam kết Dịch vụ, phân tích hồ sơ và trả kết quả báo cáo.` | — | default |
| `privacy.dieu4.legitimate_label` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(3) > strong` | Label | `Lợi ích Hợp pháp (Legitimate Interest):` | — | default |
| `privacy.dieu4.legitimate_desc` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(3)` | Description | `Phân tích dữ liệu kỹ thuật (Điều 3.4) để đảm bảo an toàn không gian mạng, phát hiện gian lận và tối ưu hóa hiệu suất nền tảng, miễn là không xâm phạm nghiêm trọng đến quyền và lợi ích của bạn.` | — | default |
| `privacy.dieu4.legal_label` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(4) > strong` | Label | `Nghĩa vụ Pháp lý (Legal Obligation):` | — | default |
| `privacy.dieu4.legal_desc` | `section#dieu-4-muc-dich-xu-ly > div > p:nth-child(4)` | Description | `Lưu trữ log truy cập, giao dịch tài chính để phục vụ mục đích kiểm toán và đáp ứng yêu cầu của cơ quan nhà nước có thẩm quyền theo Luật An ninh mạng và Luật Kế toán.` | — | default |

---

### 8. Điều 5: Chia sẻ Dữ liệu & Bên thứ ba (Sub-processors)
*Source: `apps/web-1/app/privacy/page.tsx:129-147`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu5.title` | `section#dieu-5-chia-se-du-lieu > Title[order=2]` | Heading | `5. Chia sẻ Dữ liệu & Bên thứ ba (Sub-processors)` | — | default |
| `privacy.dieu5.intro` | `section#dieu-5-chia-se-du-lieu > p` | Description | `Chúng tôi không bán Dữ liệu Cá nhân của bạn. Dữ liệu chỉ được chia sẻ theo nguyên tắc "biết những gì cần biết" (need-to-know basis) với các nhà cung cấp dịch vụ hạ tầng đám mây uy tín (Sub-processors) có ký kết Thỏa thuận Bảo vệ Dữ liệu (DPA):` | — | default |
| `privacy.dieu5.ai_label` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(1) > strong` | Label | `Cung cấp sức mạnh AI:` | — | default |
| `privacy.dieu5.ai_desc` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(1)` | Description | `Vercel AI SDK, OpenAI, Google Gemini. Chúng tôi đã thiết lập giới hạn API để vô hiệu hóa việc lưu trữ dữ liệu của bạn nhằm mục đích huấn luyện (train) các mô hình AI công khai của các đối tác này.` | — | default |
| `privacy.dieu5.payment_label` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(2) > strong` | Label | `Cổng thanh toán điện tử:` | — | default |
| `privacy.dieu5.payment_desc` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(2)` | Description | `SePay (nhận webhook giao dịch đối soát tự động thông qua OpenBanking).` | — | default |
| `privacy.dieu5.realtime_label` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(3) > strong` | Label | `Hạ tầng Real-time & Giao tiếp:` | — | default |
| `privacy.dieu5.realtime_desc` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(3)` | Description | `Centrifugo (máy chủ WebSocket duy trì chat), Resend (gửi email thông báo, OTP hệ thống).` | — | default |
| `privacy.dieu5.storage_label` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(4) > strong` | Label | `Lưu trữ tệp & Cơ sở dữ liệu:` | — | default |
| `privacy.dieu5.storage_desc` | `section#dieu-5-chia-se-du-lieu > div > p:nth-child(4)` | Description | `Cloudinary (Lưu trữ avatar, file đính kèm), các nhà cung cấp VPS/Database Cloud đặt máy chủ tuân thủ tiêu chuẩn an ninh mạng (Supabase/PostgreSQL).` | — | default |
| `privacy.dieu5.crossborder_note` | `section#dieu-5-chia-se-du-lieu > p > em` | Helper | `Lưu ý về Chuyển giao dữ liệu xuyên biên giới: Một số dịch vụ đám mây có thể lưu trữ dữ liệu ngoài lãnh thổ Việt Nam. Nexus cam kết thực hiện đầy đủ quy trình Đánh giá tác động chuyển dữ liệu ra nước ngoài và đảm bảo bên nhận dữ liệu có mức độ bảo vệ tương đương với quy định của Nghị định 13/2023/NĐ-CP.` | — | default |

---

### 9. Điều 6: Thời gian Lưu trữ Dữ liệu
*Source: `apps/web-1/app/privacy/page.tsx:149-162`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu6.title` | `section#dieu-6-thoi-gian-luu-tru > Title[order=2]` | Heading | `6. Thời gian Lưu trữ Dữ liệu` | — | default |
| `privacy.dieu6.intro` | `section#dieu-6-thoi-gian-luu-tru > p` | Description | `Chúng tôi chỉ lưu trữ Dữ liệu Cá nhân trong khoảng thời gian cần thiết để thực hiện các mục đích đã nêu:` | — | default |
| `privacy.dieu6.account_label` | `section#dieu-6-thoi-gian-luu-tru > div > p:nth-child(1) > strong` | Label | `Dữ liệu tài khoản & Hồ sơ dự án:` | — | default |
| `privacy.dieu6.account_desc` | `section#dieu-6-thoi-gian-luu-tru > div > p:nth-child(1)` | Description | `Lưu trữ trong suốt thời gian tài khoản hoạt động cho đến khi bạn yêu cầu xóa hoặc đóng tài khoản.` | — | default |
| `privacy.dieu6.tx_label` | `section#dieu-6-thoi-gian-luu-tru > div > p:nth-child(2) > strong` | Label | `Dữ liệu giao dịch:` | — | default |
| `privacy.dieu6.tx_desc` | `section#dieu-6-thoi-gian-luu-tru > div > p:nth-child(2)` | Description | `Lưu trữ tối đa mười (10) năm theo quy định của pháp luật hiện hành về kế toán, thuế.` | — | default |
| `privacy.dieu6.logs_label` | `section#dieu-6-thoi-gian-luu-tru > div > p:nth-child(3) > strong` | Label | `Log kỹ thuật (IP, Sessions):` | — | default |
| `privacy.dieu6.logs_desc` | `section#dieu-6-thoi-gian-luu-tru > div > p:nth-child(3)` | Description | `Thường được tự động xóa bỏ hoặc ẩn danh hóa sau thời hạn 6 tháng đến 1 năm nhằm mục đích điều tra an ninh.` | — | default |

---

### 10. Điều 7: Quyền của Chủ thể dữ liệu
*Source: `apps/web-1/app/privacy/page.tsx:164-178`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu7.title` | `section#dieu-7-quyen-chu-the > Title[order=2]` | Heading | `7. Quyền của Chủ thể dữ liệu` | — | default |
| `privacy.dieu7.intro` | `section#dieu-7-quyen-chu-the > p` | Description | `Bạn nắm giữ các quyền sau đối với dữ liệu của mình, và Nexus cung cấp sẵn các công cụ kỹ thuật để bạn thực thi:` | — | default |
| `privacy.dieu7.access_label` | `section#dieu-7-quyen-chu-the > div > p:nth-child(1) > strong` | Label | `Quyền truy cập & Chỉnh sửa:` | — | default |
| `privacy.dieu7.access_desc` | `section#dieu-7-quyen-chu-the > div > p:nth-child(1)` | Description | `Tự do cập nhật họ tên, mật khẩu, và thông tin khác trực tiếp trong Cài đặt Tài khoản.` | — | default |
| `privacy.dieu7.delete_label` | `section#dieu-7-quyen-chu-the > div > p:nth-child(2) > strong` | Label | `Quyền rút lại sự đồng ý & Xóa dữ liệu (Quyền được lãng quên):` | — | default |
| `privacy.dieu7.delete_desc` | `section#dieu-7-quyen-chu-the > div > p:nth-child(2)` | Description | `Bạn có quyền yêu cầu chấm dứt việc xử lý dữ liệu thông qua tính năng Xóa Tài Khoản (Delete Account) trong phần Vùng Nguy Hiểm (Danger Zone). Hệ thống của chúng tôi được lập trình để xóa hoặc ẩn danh hóa toàn bộ thông tin định danh của bạn trong thời hạn không quá 72 giờ.` | — | default |
| `privacy.dieu7.restrict_label` | `section#dieu-7-quyen-chu-the > div > p:nth-child(3) > strong` | Label | `Quyền hạn chế & Phản đối xử lý:` | — | default |
| `privacy.dieu7.restrict_desc` | `section#dieu-7-quyen-chu-the > div > p:nth-child(3)` | Description | `Bạn có thể liên hệ qua email DPO để yêu cầu tạm ngưng xử lý dữ liệu trong các trường hợp tranh chấp tính chính xác của dữ liệu.` | — | default |
| `privacy.dieu7.export_label` | `section#dieu-7-quyen-chu-the > div > p:nth-child(4) > strong` | Label | `Quyền cung cấp Dữ liệu:` | — | default |
| `privacy.dieu7.export_desc` | `section#dieu-7-quyen-chu-the > div > p:nth-child(4)` | Description | `Bạn có quyền yêu cầu xuất bản sao dữ liệu cá nhân mà chúng tôi đang lưu trữ ở định dạng máy có thể đọc được (machine-readable format).` | — | default |

---

### 11. Điều 8: Biện pháp Bảo mật & Xử lý sự cố
*Source: `apps/web-1/app/privacy/page.tsx:180-193`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu8.title` | `section#dieu-8-bao-mat > Title[order=2]` | Heading | `8. Biện pháp Bảo mật & Xử lý sự cố` | — | default |
| `privacy.dieu8.security_label` | `section#dieu-8-bao-mat > div > p:nth-child(1) > strong` | Label | `Biện pháp An ninh:` | — | default |
| `privacy.dieu8.security_desc` | `section#dieu-8-bao-mat > div > p:nth-child(1)` | Description | `Dữ liệu truyền tải giữa thiết bị của bạn và hệ thống được mã hóa TLS/HTTPS. Hệ cơ sở dữ liệu được phân quyền chặt chẽ theo mô hình RBAC (Role-Based Access Control) và Row-Level Security, cùng với các biện pháp chống tấn công injection, XSS, CSRF theo tiêu chuẩn OWASP.` | — | default |
| `privacy.dieu8.breach_label` | `section#dieu-8-bao-mat > div > p:nth-child(2) > strong` | Label | `Quy trình Ứng phó Sự cố (Data Breach Response):` | — | default |
| `privacy.dieu8.breach_desc` | `section#dieu-8-bao-mat > div > p:nth-child(2)` | Description | `Trong trường hợp không may xảy ra vi phạm, rò rỉ dữ liệu cá nhân, chúng tôi cam kết: (1) Cách ly hệ thống và khắc phục lỗ hổng ngay lập tức; (2) Thông báo cho Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05) trực thuộc Bộ Công an trong thời hạn 72 giờ; và (3) Gửi email thông báo khẩn cấp, minh bạch tới người dùng bị ảnh hưởng, kèm theo các biện pháp tự bảo vệ.` | — | default |

---

### 12. Điều 9: Quyền riêng tư của Trẻ em
*Source: `apps/web-1/app/privacy/page.tsx:195-203`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu9.title` | `section#dieu-9-quyen-tre-em > Title[order=2]` | Heading | `9. Quyền riêng tư của Trẻ em` | — | default |
| `privacy.dieu9.desc` | `section#dieu-9-quyen-tre-em > p` | Description | `Dịch vụ của Nexus Platform được thiết kế hướng tới môi trường giáo dục đại học. Chúng tôi không cố ý thu thập dữ liệu cá nhân của người dưới 16 tuổi. Trẻ em từ 7 tuổi đến dưới 16 tuổi khi tạo tài khoản phải có sự đồng ý giám sát của cha mẹ hoặc người giám hộ hợp pháp. Nếu phát hiện dữ liệu của đối tượng này được cung cấp trái quy định, chúng tôi sẽ tiến hành xóa bỏ không cần báo trước.` | — | default |

---

### 13. Điều 10: Cập nhật chính sách & Liên hệ
*Source: `apps/web-1/app/privacy/page.tsx:205-216`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `privacy.dieu10.title` | `section#dieu-10-lien-he > Title[order=2]` | Heading | `10. Cập nhật chính sách & Liên hệ` | — | default |
| `privacy.dieu10.update_desc` | `section#dieu-10-lien-he > p:nth-child(2)` | Description | `Chính sách bảo mật này có hiệu lực từ ngày công bố ở đầu trang. Khi chúng tôi có những sửa đổi mang tính chất quan trọng ảnh hưởng đến quyền lợi của bạn, hệ thống sẽ yêu cầu bạn xác nhận đồng ý lại ở lần đăng nhập tiếp theo.` | — | default |
| `privacy.dieu10.contact_intro` | `section#dieu-10-lien-he > p:nth-child(3)` | Description | `Mọi thắc mắc, yêu cầu khiếu nại hoặc thực thi quyền chủ thể dữ liệu, vui lòng gửi email tới Bộ phận Pháp chế (DPO) qua địa chỉ:` | — | default |
| `privacy.dieu10.contact_email` | `section#dieu-10-lien-he > p:nth-child(3) > strong` | Item | `phungluuhoanglong@gmail.com` | — | default |
| `privacy.dieu10.contact_commit` | `section#dieu-10-lien-he > p:nth-child(3)` | Description | `Chúng tôi cam kết xử lý và phản hồi trong thời gian sớm nhất theo luật định.` | — | default |

---

### 14. Footer
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `footer.logo` | `Logo` > `img[alt]` | Alt text | `Nexus Logo` | `/` | default |
| `footer.link.privacy` | `Anchor` | Navigation | `Chính sách bảo mật` | `/privacy` | default |
| `footer.link.terms` | `Anchor` | Navigation | `Điều khoản sử dụng` | `/terms` | default |
| `footer.link.refund` | `Anchor` | Navigation | `Thanh toán & Hoàn tiền` | `/refund-policy` | default |
| `footer.link.fair_use` | `Anchor` | Navigation | `Quy chế & Fair-Use` | `/fair-use-policy` | default |
| `footer.social.fb_label` | `ActionIcon[aria-label]` | Aria-label | `Nexus Facebook Page` | `https://www.facebook.com/profile.php?id=61591506814865` | default |
| `footer.copyright` | `Text` | Description | `© {new Date().getFullYear()} Nexus Platform. Tất cả quyền được bảo lưu.` | — | default |

---

## Notes

- **Thuật ngữ & Biến thể quan sát được trên trang:**
  - Tiêu đề văn bản: Code truyền prop `title="Chính sách Bảo vệ Dữ liệu Cá nhân"` (`page.tsx:29`), nhưng metadata đặt là `"Chính sách bảo mật | Nexus Platform"` (`page.tsx:8`), và Footer liên kết qua nhãn `"Chính sách bảo mật"` (`AppShell.tsx:51`).
  - Tiêu đề khối mục lục: Sidebar hiển thị nhãn hardcode `"Mục lục điều khoản"` (`PolicyDocumentLayout.tsx:117`) dù đây là trang chính sách bảo vệ dữ liệu.
  - Tên đơn vị chủ quản: Được gọi là `"Hệ sinh thái Hỗ trợ Ý tưởng & Kiểm định Khởi nghiệp Sinh viên Nexus"` (`page.tsx:55`), kết hợp với tên thương hiệu `"Nexus Platform"` (`page.tsx:42, 56, 144`).
  - Bộ phận chuyên trách dữ liệu: Xuất hiện với các tên gọi `"Nhân sự phụ trách Bảo vệ Dữ liệu (DPO)"` (`page.tsx:56`), `"Ban Kỹ thuật & Pháp chế Nexus Platform"` (`page.tsx:56`), và `"Bộ phận Pháp chế (DPO)"` (`page.tsx:213`).
  - Đơn vị đề tài / dữ liệu học thuật: Được gọi là `"Hồ sơ hỗ trợ (Case)"` (`page.tsx:94`), `"Hồ sơ dự án"` (`page.tsx:157`), và cụ thể hóa thành `"Mô tả ý tưởng, tệp đính kèm (PDF, DOCX), log tin nhắn chat trực tiếp với Supporter, báo cáo đánh giá hệ thống"` (`page.tsx:92-93`).
  - Đơn vị phản biện: Xuất hiện với danh xưng `"Supporter"` (`page.tsx:93`).
  - Dữ liệu tài chính: Định danh là `"Lịch sử giao dịch ví VND, mã tham chiếu ngân hàng (Reference ID), số dư khả dụng"` (`page.tsx:87`).
- **Code behavior quan sát được:**
  - Component `PolicyDocumentLayout`: Tạo thanh sidebar sticky bên phải màn hình desktop (`hidden lg:block`), lắng nghe sự kiện `scroll` trên `window` để tính toán khoảng cách cuộn và gán class active (`text-brand font-semibold`) cho mục TOC đang đọc (`PolicyDocumentLayout.tsx:40-54`).
  - Hàm `scrollToSection`: Can thiệp sự kiện click vào các anchor trong TOC, tính toán offset vị trí trừ đi 80px để cuộn mượt (`window.scrollTo({ top: offsetPosition, behavior: "smooth" })`) tránh bị che khuất bởi header sticky (`PolicyDocumentLayout.tsx:56-72`).
  - Header & Drawer: Nút `"Đăng nhập"` có thuộc tính `component={Link}` dẫn về `/auth` (nguồn: `AppShell.tsx:78, 121`).
  - Sidebar hỗ trợ: Khối liên hệ cuối mục lục gắn trực tiếp liên kết `mailto:phungluuhoanglong@gmail.com` vào thẻ `<a>` (nguồn: `PolicyDocumentLayout.tsx:144-149`).
  - Footer: Nút icon Facebook mở tab mới (`target="_blank"`, `rel="noopener noreferrer"`) dẫn tới URL `https://www.facebook.com/profile.php?id=61591506814865` (nguồn: `AppShell.tsx:168-182`).
- **Điểm chưa xác minh (Unknowns / Questions):**
  - Text tại Điều 7 đề cập: *"tính năng Xóa Tài Khoản (Delete Account) trong phần Vùng Nguy Hiểm (Danger Zone). Hệ thống của chúng tôi được lập trình để xóa hoặc ẩn danh hóa toàn bộ thông tin định danh của bạn trong thời hạn không quá 72 giờ"* — Cần đối soát với trang cài đặt người dùng (`/dashboard/settings/profile`) xem chức năng Danger Zone / Xóa tài khoản đã có component và API endpoint hay đang là cam kết chính sách.
  - Text tại Điều 10 đề cập: *"Khi chúng tôi có những sửa đổi mang tính chất quan trọng ảnh hưởng đến quyền lợi của bạn, hệ thống sẽ yêu cầu bạn xác nhận đồng ý lại ở lần đăng nhập tiếp theo"* — Chưa xác minh liệu backend Better Auth và database (`prisma/schema.prisma`) đã có trường lưu version chính sách đã đồng ý và middleware chặn đăng nhập để buộc re-consent hay chưa.
  - Tiêu đề sidebar `"Mục lục điều khoản"` đang dùng chung cho tất cả các trang chính sách (bao gồm cả `/privacy`, `/refund-policy`, `/fair-use-policy`) do hardcode trong `PolicyDocumentLayout.tsx:117` thay vì truyền qua prop.
