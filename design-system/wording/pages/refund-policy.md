# Page: Chính sách Thanh toán & Hoàn tiền
Route: `/refund-policy`  
Access: `Public`

---

## Page Context

### User
- **Primary user:** Sinh viên, khách hàng tiềm năng hoặc người dùng hiện tại quan tâm đến quy chế nạp tiền, hoàn tiền, rút tiền và sử dụng điểm Credit trên hệ thống.
- **Typical state:** `[Assumption / Cần xác minh]` Chuẩn bị nạp tiền vào ví / mua gói audit hoặc đang gặp sự cố với hồ sơ cần tìm hiểu quy chế hoàn tiền, hủy bài, rút tiền về tài khoản ngân hàng.
- **Knowledge level:** Biết Nexus có thu phí qua các gói kiểm tra/audit hoặc điểm Credit; cần nắm rõ cơ chế bảo vệ quyền lợi tiền tệ trước khi thực hiện giao dịch hoặc khi phát sinh khiếu nại.

### User goals
- Nắm rõ quy chế quản lý ví VND (đơn vị tiền tệ, số dư có bị hết hạn hoặc thu phí duy trì không).
- Hiểu cách thức quy đổi và vòng đời của điểm tín dụng Credit (Credit trả phí có hạn bao lâu, Credit thưởng/khuyến mãi có hạn bao lâu, thời điểm chính xác Credit bị trừ).
- Nắm rõ điều kiện hoàn tiền 100% tự động về Ví VND, các trường hợp hoàn tiền một phần (50%), và các trường hợp không đủ điều kiện hoàn tiền.
- Nắm rõ quy định rút tiền mặt về tài khoản ngân hàng (hạn mức tối thiểu, thời gian giải ngân, yêu cầu định danh chính chủ / KYC).
- Biết quy trình xử lý khiếu nại giao dịch (chargeback) và thông tin liên hệ hỗ trợ.

### Business/Product goals
- Thiết lập khung pháp lý minh bạch, tạo niềm tin cho người dùng khi nạp tiền và thanh toán qua cổng SePay / VietQR.
- Giảm thiểu tranh chấp giao dịch (dispute, chargeback) bằng việc công khai minh bạch các điều kiện hoàn trả và cam kết thời gian dịch vụ (SLA).
- Tuân thủ quy định pháp luật và chuẩn mực thanh toán điện tử (phòng chống rửa tiền AML, kiểm soát rút tiền, thuế VAT).

### Primary action
- Đọc và tra cứu các điều khoản qua Mục lục điều khoản (TOC sticky sidebar) để tìm hiểu quyền lợi và nghĩa vụ tài chính.

### Secondary actions
- Bấm `Quay lại trang chủ` để về trang chủ (`/`).
- Bấm `Đăng nhập` trên Header hoặc Mobile Drawer để vào `/auth`.
- Bấm chuyển đổi theme giao diện sáng/tối (`Toggle theme`).
- Bấm chuyển sang các trang chính sách khác ở Footer (`Chính sách bảo mật`, `Điều khoản sử dụng`, `Quy chế & Fair-Use`).
- Bấm liên kết email `phungluuhoanglong@gmail.com` để gửi thư yêu cầu hỗ trợ về điều khoản hoặc khiếu nại giao dịch.
- Bấm icon mạng xã hội để mở trang Facebook của Nexus Platform.

### Entry
- Footer trang chủ (`/`) hoặc footer các trang công khai qua liên kết "Thanh toán & Hoàn tiền".
- Điều hướng từ trang nạp ví (`/dashboard/wallet`) hoặc trang thanh toán (`/dashboard/payment`, `/dashboard/case/[id]/payment`) `[Assumption / Cần xác minh]`.
- Truy cập trực tiếp qua đường dẫn URL `/refund-policy`.

### Exit / next step
- Bấm `Quay lại trang chủ` hoặc Logo → Trở về trang chủ (`/`).
- Bấm `Đăng nhập` → Chuyển sang trang đăng nhập (`/auth`).
- Bấm các liên kết Footer → Chuyển sang `/privacy`, `/terms`, `/fair-use-policy`, hoặc mở Facebook trong tab mới.
- Bấm liên kết email → Mở ứng dụng email mặc định gửi thư tới `phungluuhoanglong@gmail.com`.

### Product facts / constraints
- **Đơn vị tiền tệ:** Mọi giao dịch được ghi nhận và xử lý bằng Việt Nam Đồng (VND); số dư nạp qua cổng thanh toán SePay/VietQR (nguồn: `page.tsx:50-51`).
- **Thời hạn ví:** Số dư trong Ví VND không bao giờ hết hạn; Nexus không thu phí quản lý, phí duy trì hay phí không hoạt động (nguồn: `page.tsx:53-54`).
- **Hạn sử dụng Credit:** Credit Trả phí có hiệu lực 12 tháng (365 ngày); Credit Khuyến mãi/Thưởng hết hạn sau 90 ngày và không quy đổi thành tiền mặt (nguồn: `page.tsx:72-74`).
- **Thông báo hết hạn Credit:** Hệ thống tự động gửi email và push notification nhắc nhở trước khi Credit hết hạn tại các mốc 30 ngày, 7 ngày và 24 giờ (nguồn: `page.tsx:76-77`).
- **Thời điểm trừ Credit:** Credit chỉ bị trừ vĩnh viễn khi Cố vấn chuyên môn (Supporter) đã chính thức xuất bản Báo cáo đánh giá (trạng thái `Report Ready`) (nguồn: `page.tsx:79-80`).
- **Chuyển nhượng Credit:** Không thể chuyển nhượng Credit giữa hai tài khoản độc lập; tuy nhiên các thành viên trong cùng một Hồ sơ (Case) được thụ hưởng chung (nguồn: `page.tsx:82-83`).
- **Hoàn tiền 100% tự động về Ví VND:** Áp dụng khi hệ thống/Admin từ chối (Veto), Supporter trễ hẹn trả báo cáo quá 48 giờ (SLA Breach), hoặc người dùng ấn nút "Hủy hồ sơ" trước khi Supporter bắt đầu phân tích (`pending` hoặc `assigned`) (nguồn: `page.tsx:97-101`).
- **Hoàn tiền một phần (50%):** Xem xét hoàn tối đa 50% khi hồ sơ đang phân tích (`in_progress`) nhưng gặp sự cố bất khả kháng cần dừng lại (nguồn: `page.tsx:103-104`).
- **Không hoàn tiền:** Khi Báo cáo đã xuất bản (`completed`) hoặc tài khoản vi phạm đạo văn, gian lận (nguồn: `page.tsx:106-107`).
- **Rút tiền mặt về ngân hàng:** Số tiền rút tối thiểu 50.000 VNĐ; thời gian xử lý 3-5 ngày làm việc; bắt buộc khớp tên định danh chủ tài khoản ngân hàng (nguồn: `page.tsx:118-122`).
- **Thuế & phí:** Giá niêm yết đã bao gồm thuế gián thu (VAT); phí chuyển khoản rút tiền do ngân hàng thụ hưởng thu sẽ do người dùng chi trả (nguồn: `page.tsx:147-148`).
- **Phiên bản & ngày cập nhật:** Phiên bản `2026-08-v2.0`, cập nhật lần cuối `30/08/2026` (nguồn: `page.tsx:28-29`).
- **Email tiếp nhận hỗ trợ / tra soát:** `phungluuhoanglong@gmail.com` (nguồn: `PolicyDocumentLayout.tsx:145-149`, `page.tsx:133`).

---

## Interactive Inventory

### 1. Document Metadata
*Source: `apps/web-1/app/refund-policy/page.tsx:8-11`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `meta.title` | `metadata.title` | Item | `Chính sách Thanh toán & Hoàn tiền \| Nexus Platform` | — | default |
| `meta.description` | `metadata.description` | Description | `Quy định chi tiết về quản lý ví VND, vòng đời Credit, chính sách hoàn tiền, rút tiền và giải quyết khiếu nại giao dịch theo tiêu chuẩn quốc tế.` | — | default |

---

### 2. Header & Navigation (AppShell)
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `header.logo.alt` | `Logo` > `img[alt]` (Header desktop) | Alt text | `Nexus Logo` | `/` | default |
| `header.theme.toggle` | `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | `Toggle theme` | Chuyển đổi theme Sáng/Tối | default |
| `header.nav.login` | `Button` (Header desktop) | CTA | `Đăng nhập` | `/auth` | default |
| `header.mobile.burger` | `Burger` (Header mobile) | CTA | *(Không có text - Icon Burger)* | Đóng/mở drawer mobile | default |
| `header.mobile.logo_alt` | `Logo` > `img[alt]` (Drawer mobile) | Alt text | `Nexus Logo` | `/` | default |
| `header.mobile.login` | `Drawer` > `Button` (Mobile menu) | CTA | `Đăng nhập` | `/auth` | default |

---

### 3. Document Header & Sticky Sidebar
*Source: `apps/web-1/components/policy/PolicyDocumentLayout.tsx` & `apps/web-1/app/refund-policy/page.tsx:24-30`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.back_link` | `Link` (Header văn bản) | Navigation | `Quay lại trang chủ` | `/` | default |
| `policy.title` | `Title` (h1) | Heading | `Chính sách Thanh toán & Hoàn tiền` | — | default |
| `policy.subtitle` | `Text` | Description | `Văn bản này quy định minh bạch về cơ chế tài chính, vòng đời tín dụng và bảo vệ quyền lợi người dùng trên Nexus Platform, tuân thủ các quy chuẩn thanh toán điện tử quốc tế.` | — | default |
| `policy.meta.updated_at` | `span` (Metadata văn bản) | Item | `Cập nhật lần cuối: 30/08/2026` | — | default |
| `policy.meta.version` | `span` (Metadata văn bản) | Item | `Phiên bản: 2026-08-v2.0` | — | default |
| `sidebar.toc.title` | `Text` (Sidebar heading) | Heading | `Mục lục điều khoản` | — | default |
| `sidebar.toc.item_1` | `Anchor` (TOC mục 1) | Navigation | `1. Tổng quan & Nguyên tắc chung` | `#dieu-1-tong-quan` | default |
| `sidebar.toc.item_2` | `Anchor` (TOC mục 2) | Navigation | `2. Quy chế Ví tài khoản (VND Wallet)` | `#dieu-2-vi-vnd` | default |
| `sidebar.toc.item_3` | `Anchor` (TOC mục 3) | Navigation | `3. Vòng đời Điểm tín dụng (Credit)` | `#dieu-3-vong-doi-credit` | default |
| `sidebar.toc.item_4` | `Anchor` (TOC mục 4) | Navigation | `4. Chính sách Hoàn tiền (Refunds)` | `#dieu-4-chinh-sach-hoan-tien` | default |
| `sidebar.toc.item_5` | `Anchor` (TOC mục 5) | Navigation | `5. Rút tiền & Phòng chống rửa tiền (AML)` | `#dieu-5-rut-tien-aml` | default |
| `sidebar.toc.item_6` | `Anchor` (TOC mục 6) | Navigation | `6. Khiếu nại giao dịch (Chargebacks)` | `#dieu-6-khieu-nai-chargeback` | default |
| `sidebar.toc.item_7` | `Anchor` (TOC mục 7) | Navigation | `7. Thuế & Lệ phí` | `#dieu-7-thue-le-phi` | default |
| `sidebar.support.text` | `p` (Sidebar hỗ trợ) | Description | `Cần hỗ trợ về điều khoản?` | — | default |
| `sidebar.support.email` | `a[href]` (Sidebar email) | CTA | `phungluuhoanglong@gmail.com` | `mailto:phungluuhoanglong@gmail.com` | default |

---

### 4. Điều 1: Tổng quan & Nguyên tắc chung
*Source: `apps/web-1/app/refund-policy/page.tsx:34-41`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_1.title` | `Title` (h2) | Heading | `1. Tổng quan & Nguyên tắc chung` | — | default |
| `section_1.content` | `p` | Description | `Chính sách Thanh toán & Hoàn tiền này (sau đây gọi là "Chính sách") thiết lập các khung pháp lý và quy trình vận hành liên quan đến tiền tệ và tài sản kỹ thuật số (Credit) trên nền tảng Nexus Platform. Bằng việc thực hiện bất kỳ giao dịch nạp tiền hoặc mua gói dịch vụ nào, bạn đồng ý chịu sự ràng buộc bởi các quy định tài chính dưới đây.` | — | default |

---

### 5. Điều 2: Quy chế Ví tài khoản (VND Wallet)
*Source: `apps/web-1/app/refund-policy/page.tsx:44-59`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_2.title` | `Title` (h2) | Heading | `2. Quy chế Ví tài khoản (VND Wallet)` | — | default |
| `section_2.item_2_1.label` | `p > strong` | Label | `2.1. Đơn vị tiền tệ:` | — | default |
| `section_2.item_2_1.desc` | `p` | Description | `Mọi giao dịch được ghi nhận và xử lý bằng Việt Nam Đồng (VND). Số dư trong Ví cá nhân (`UserWallet`) thể hiện số tiền thực tế bạn đã nạp qua cổng thanh toán được cấp phép (SePay/VietQR).` | — | default |
| `section_2.item_2_2.label` | `p > strong` | Label | `2.2. Không hết hạn:` | — | default |
| `section_2.item_2_2.desc` | `p` | Description | `Số dư tiền thật trong Ví VND của bạn KHÔNG bao giờ hết hạn. Nexus không thu phí quản lý, phí duy trì tài khoản, hay phí phạt do tài khoản không hoạt động (inactivity fee).` | — | default |
| `section_2.item_2_3.label` | `p > strong` | Label | `2.3. Mục đích sử dụng:` | — | default |
| `section_2.item_2_3.desc` | `p` | Description | `Số dư Ví VND chỉ được sử dụng để mua sắm các gói dịch vụ, điểm Credit hoặc các tiện ích nội bộ trên hệ thống Nexus Platform.` | — | default |

---

### 6. Điều 3: Vòng đời Điểm tín dụng (Credit Lifecycle)
*Source: `apps/web-1/app/refund-policy/page.tsx:62-85`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_3.title` | `Title` (h2) | Heading | `3. Vòng đời Điểm tín dụng (Credit Lifecycle)` | — | default |
| `section_3.intro` | `p` | Description | `Credit là đơn vị quy đổi dịch vụ. Nexus áp dụng chính sách quản lý vòng đời Credit nghiêm ngặt nhằm đảm bảo chất lượng cam kết:` | — | default |
| `section_3.item_3_1.label` | `p > strong` | Label | `3.1. Phân loại & Hạn sử dụng:` | — | default |
| `section_3.item_3_1.paid` | `p` (Dòng 1) | Item | `- Credit Trả phí (Paid Credit): Mua bằng tiền từ Ví VND, có thời hạn hiệu lực chính xác là mười hai (12) tháng (365 ngày) kể từ thời điểm giao dịch thành công.` | — | default |
| `section_3.item_3_1.promo` | `p` (Dòng 2) | Item | `- Credit Khuyến mãi/Thưởng (Promotional Credit): Được cấp qua các chương trình đối tác, mặc định hết hạn sau chín mươi (90) ngày và không có giá trị quy đổi thành tiền mặt.` | — | default |
| `section_3.item_3_2.label` | `p > strong` | Label | `3.2. Thông báo hết hạn:` | — | default |
| `section_3.item_3_2.desc` | `p` | Description | `Tuân thủ luật bảo vệ người tiêu dùng, hệ thống sẽ tự động gửi email và thông báo (push notification) nhắc nhở trước khi Credit hết hạn tại các mốc: 30 ngày, 7 ngày và 24 giờ.` | — | default |
| `section_3.item_3_3.label` | `p > strong` | Label | `3.3. Thời điểm Khấu trừ:` | — | default |
| `section_3.item_3_3.desc` | `p` | Description | `Credit CHỈ bị trừ vĩnh viễn khỏi tài khoản của bạn khi Cố vấn chuyên môn (Supporter) đã chính thức xuất bản Báo cáo đánh giá (trạng thái `Report Ready`). Mọi thao tác nộp hồ sơ, trao đổi hoặc vòng sửa đổi (Revision) đều không làm phát sinh thêm phí.` | — | default |
| `section_3.item_3_4.label` | `p > strong` | Label | `3.4. Chuyển nhượng (Transferability):` | — | default |
| `section_3.item_3_4.desc` | `p` | Description | `Để phòng chống rửa tiền và chợ đen, Credit không thể chuyển nhượng giữa hai tài khoản độc lập. Tuy nhiên, toàn bộ thành viên trong cùng một Hồ sơ (Case) đều được thụ hưởng chung quyền lợi do Chủ sở hữu (Owner) chi trả.` | — | default |

---

### 7. Điều 4: Chính sách Hoàn tiền (Refund Policy)
*Source: `apps/web-1/app/refund-policy/page.tsx:88-109`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_4.title` | `Title` (h2) | Heading | `4. Chính sách Hoàn tiền (Refund Policy)` | — | default |
| `section_4.intro` | `p` | Description | `Nexus cam kết bảo vệ khoản đầu tư giáo dục của bạn với chính sách hoàn trả minh bạch:` | — | default |
| `section_4.item_4_1.label` | `p > strong` | Label | `4.1. Hoàn 100% tự động về Ví VND:` | — | default |
| `section_4.item_4_1.intro` | `p` (Dòng dẫn) | Description | `Áp dụng ngay lập tức trong các trường hợp:` | — | default |
| `section_4.item_4_1.bullet_1` | `p` (Gạch đầu dòng 1) | Item | `- Hệ thống/Admin từ chối tiếp nhận hồ sơ (Veto) do vượt quá năng lực chuyên môn hoặc nội dung không hợp lệ.` | — | default |
| `section_4.item_4_1.bullet_2` | `p` (Gạch đầu dòng 2) | Item | `- Cố vấn (Supporter) vi phạm Cam kết thời gian dịch vụ (SLA Breach), trễ hẹn trả báo cáo quá 48 giờ.` | — | default |
| `section_4.item_4_1.bullet_3` | `p` (Gạch đầu dòng 3) | Item | `- Bạn chủ động ấn nút "Hủy hồ sơ" trước khi Supporter bắt đầu quy trình phân tích (`pending` hoặc `assigned`).` | — | default |
| `section_4.item_4_2.label` | `p > strong` | Label | `4.2. Hoàn tiền một phần (Pro-rated Refund):` | — | default |
| `section_4.item_4_2.desc` | `p` | Description | `Nếu hồ sơ đang trong quá trình phân tích (`in_progress`) nhưng bạn gặp sự cố bất khả kháng cần dừng lại, Quản trị viên sẽ xem xét khối lượng công việc đã thực hiện để quyết định hoàn trả tối đa 50% giá trị gói.` | — | default |
| `section_4.item_4_3.label` | `p > strong` | Label | `4.3. Không đủ điều kiện hoàn tiền:` | — | default |
| `section_4.item_4_3.desc` | `p` | Description | `Tuyệt đối không hoàn tiền khi Báo cáo đã được xuất bản (`completed`), hoặc khi tài khoản của bạn bị khóa do vi phạm liêm chính học thuật (đạo văn), gian lận hệ thống.` | — | default |

---

### 8. Điều 5: Rút tiền & Phòng chống rửa tiền (AML Compliance)
*Source: `apps/web-1/app/refund-policy/page.tsx:112-124`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_5.title` | `Title` (h2) | Heading | `5. Rút tiền & Phòng chống rửa tiền (AML Compliance)` | — | default |
| `section_5.item_5_1.label` | `p > strong` | Label | `5.1. Định danh chính chủ:` | — | default |
| `section_5.item_5_1.desc` | `p` | Description | `Để tuân thủ Luật Phòng, chống rửa tiền, mọi yêu cầu rút số dư khả dụng từ Ví VND về tài khoản ngân hàng bắt buộc phải khớp lệnh với thông tin định danh (Tên chủ tài khoản ngân hàng phải khớp với tên đã đăng ký tài khoản). Chúng tôi có quyền yêu cầu xác minh danh tính (KYC) đối với các khoản rút bất thường.` | — | default |
| `section_5.item_5_2.label` | `p > strong` | Label | `5.2. Mức rút & Thời gian:` | — | default |
| `section_5.item_5_2.desc` | `p` | Description | `Số tiền yêu cầu tối thiểu là 50.000 VNĐ. Thời gian xử lý đối soát và giải ngân chuẩn là từ ba (03) đến năm (05) ngày làm việc (không tính T7, CN và ngày Lễ).` | — | default |

---

### 9. Điều 6: Khiếu nại giao dịch (Chargebacks & Disputes)
*Source: `apps/web-1/app/refund-policy/page.tsx:126-140`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_6.title` | `Title` (h2) | Heading | `6. Khiếu nại giao dịch (Chargebacks & Disputes)` | — | default |
| `section_6.item_6_1.label` | `p > strong` | Label | `6.1. Giải quyết nội bộ trước:` | — | default |
| `section_6.item_6_1.desc` | `p` | Description | `Trước khi yêu cầu ngân hàng hoàn tiền (chargeback), bạn đồng ý liên hệ với bộ phận CSKH của Nexus (phungluuhoanglong@gmail.com) để chúng tôi có cơ hội tra soát và giải quyết thỏa đáng.` | — | default |
| `section_6.item_6_2.label` | `p > strong` | Label | `6.2. Gian lận Chargeback:` | — | default |
| `section_6.item_6_2.desc` | `p` | Description | `Việc cố tình lạm dụng cơ chế chargeback của ngân hàng sau khi đã nhận và sử dụng dịch vụ thành công cấu thành hành vi lừa đảo. Nexus bảo lưu quyền khóa vĩnh viễn tài khoản và cung cấp bằng chứng giao dịch cho cơ quan pháp luật hoặc tổ chức phát hành thẻ.` | — | default |

---

### 10. Điều 7: Thuế & Lệ phí
*Source: `apps/web-1/app/refund-policy/page.tsx:142-150`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `section_7.title` | `Title` (h2) | Heading | `7. Thuế & Lệ phí` | — | default |
| `section_7.content` | `p` | Description | `Trừ khi được biểu thị rõ ràng, mọi mức giá niêm yết trên Nexus Platform đã bao gồm các loại thuế gián thu (như Thuế Giá trị Gia tăng - VAT) theo quy định của pháp luật Việt Nam. Người dùng tự chịu trách nhiệm kê khai và nộp các loại thuế thu nhập cá nhân phát sinh từ việc sử dụng các dịch vụ liên đới (nếu có). Phí chuyển khoản khi rút tiền (do ngân hàng thụ hưởng thu) sẽ do người dùng chi trả.` | — | default |

---

### 11. Footer (AppShell)
*Source: `apps/web-1/components/layout/AppShell.tsx:139-191`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `footer.logo.alt` | `Logo` > `img[alt]` (Footer centered) | Alt text | `Nexus Logo` | `/` | default |
| `footer.link.privacy` | `Anchor` | Navigation | `Chính sách bảo mật` | `/privacy` | default |
| `footer.link.terms` | `Anchor` | Navigation | `Điều khoản sử dụng` | `/terms` | default |
| `footer.link.refund` | `Anchor` | Navigation | `Thanh toán & Hoàn tiền` | `/refund-policy` | default |
| `footer.link.fair_use` | `Anchor` | Navigation | `Quy chế & Fair-Use` | `/fair-use-policy` | default |
| `footer.facebook` | `ActionIcon[aria-label]` | Navigation | `Nexus Facebook Page` | `https://www.facebook.com/profile.php?id=61591506814865` | default |
| `footer.copyright` | `Text` | Item | `© 2026 Nexus Platform. Tất cả quyền được bảo lưu.` | — | default |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Tiền tệ & Đơn vị điểm:**
  - `Việt Nam Đồng (VND)` vs `VNĐ` (xuất hiện ở Điều 5.2).
  - `Ví tài khoản (VND Wallet)` vs `Ví cá nhân (UserWallet)` vs `Ví VND`.
  - `Điểm tín dụng (Credit)` vs `Credit Trả phí (Paid Credit)` vs `Credit Khuyến mãi/Thưởng (Promotional Credit)`.
- **Vai trò người hỗ trợ / đánh giá:**
  - `Cố vấn chuyên môn (Supporter)` (Điều 3.3).
  - `Cố vấn (Supporter)` (Điều 4.1).
  - `Supporter` (Điều 4.1).
  - `Quản trị viên` (Điều 4.2) vs `Hệ thống/Admin` (Điều 4.1).
- **Trạng thái hồ sơ & cơ chế hệ thống ghi nhận trong văn bản:**
  - `Report Ready` (trạng thái kích hoạt khấu trừ Credit).
  - `pending` hoặc `assigned` (giai đoạn sinh viên có thể hủy bài nhận hoàn 100%).
  - `in_progress` (giai đoạn hồ sơ đang phân tích, chỉ xem xét hoàn tối đa 50%).
  - `completed` (báo cáo đã xuất bản, không hoàn tiền).
  - `Veto` (hệ thống/admin từ chối tiếp nhận hồ sơ).
  - `SLA Breach` (vi phạm cam kết thời gian dịch vụ, quá 48 giờ).

### Hiện trạng kỹ thuật quan sát được
- **Layout & Điều hướng TOC:** Trang sử dụng `PolicyDocumentLayout`, tự động lắng nghe sự kiện scroll (`window.scrollY + 120`) để cập nhật `activeSection` tương ứng trong menu mục lục bên phải (`refundTOC`), và có tính toán offset (80px) để cuộn mượt khi click vào từng điều khoản.
- **Tính năng Rút tiền mặt (Withdrawal):** Trong văn bản chính sách quy định chi tiết mức rút tối thiểu 50.000 VNĐ và thời gian 3-5 ngày làm việc (Điều 5.2). Tuy nhiên, trên toàn bộ giao diện người dùng (`apps/web-1/app/dashboard/wallet/`) và HTTP API (`apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts`) hiện **chưa có endpoint hoặc form người dùng tự tạo lệnh rút tiền**. Hiện tại API chỉ hỗ trợ nạp tiền qua cổng SePay (`POST /api/deposits`), trừ tiền ví mua credit (`walletService.withdraw`), và hoàn tiền nội bộ vào ví (`walletService.refund`). Quy trình rút tiền thực tế hiện tại là quy trình thủ công / hành chính ngoài luồng.
- **Tính năng Hủy hồ sơ (User Cancellation):** Điều 4.1 đề cập *"Bạn chủ động ấn nút 'Hủy hồ sơ' trước khi Supporter bắt đầu quy trình phân tích (`pending` hoặc `assigned`)"*. Trong backend có transition `T15_CANCEL` hoàn trả credit còn lại (`refundRemainingCredit`), nhưng nút bấm trực tiếp để sinh viên tự hủy hồ sơ chưa được bố trí rõ trên giao diện workspace sinh viên.
- **Kênh hỗ trợ liên hệ:** Email `phungluuhoanglong@gmail.com` được hardcode trực tiếp ở 2 vị trí: sidebar hỗ trợ điều khoản (`PolicyDocumentLayout.tsx:145-149`) và Điều 6.1 về giải quyết khiếu nại giao dịch (`page.tsx:133`).

### Điểm chưa xác minh (Unknowns / Questions)
- **Cơ chế nộp yêu cầu rút tiền:** Người dùng cần liên hệ qua kênh nào (email CSKH, ticket hay sẽ có form rút tiền trên UI Ví sau này) khi muốn rút số dư khả dụng từ Ví VND về ngân hàng?
- **Nút "Hủy hồ sơ" trên UI:** Cần xác nhận với Product Owner vị trí hiển thị dự kiến của nút "Hủy hồ sơ" trên giao diện sinh viên khi hồ sơ ở trạng thái `pending` hoặc `assigned` để người dùng thực hiện quyền hủy như cam kết trong chính sách.
- **Đồng bộ hóa tên vai trò:** Trong tài liệu chính sách dùng *"Cố vấn chuyên môn (Supporter)"*, *"Cố vấn (Supporter)"* và *"Supporter"*. Cần PO thống nhất định danh vai trò để đồng bộ giữa văn bản pháp lý và giao diện dashboard.
