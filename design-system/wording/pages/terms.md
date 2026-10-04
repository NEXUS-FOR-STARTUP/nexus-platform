# Page: Terms of Service
Route: `/terms`  
Access: `Public`

---

## Page Context

### User
- **Primary user:** Người dùng vãng lai, sinh viên đang chuẩn bị sử dụng dịch vụ, hoặc người dùng đã tạo tài khoản cần tra cứu các điều khoản pháp lý, quy chế bảo vệ quyền sở hữu trí tuệ, chính sách thanh toán, ví tín dụng và hoàn tiền.
- **Typical state:** Đang tìm hiểu tính pháp lý, mức độ an toàn của dữ liệu dự án khi tải lên nền tảng, cơ chế khấu trừ ví/credit, hoặc điều kiện được hoàn tiền khi nộp bài.
- **Knowledge level:** Biết Nexus là nền tảng hỗ trợ phản biện dự án khởi nghiệp/học thuật, cần hiểu rõ ranh giới trách nhiệm, chuẩn mực liêm chính học thuật và quyền lợi người dùng.

### User goals
- Đọc và tra cứu toàn bộ 10 điều khoản sử dụng của Nexus Platform.
- Xác định quyền sở hữu trí tuệ đối với ý tưởng, pitch deck, slide tải lên (Điều 4).
- Hiểu rõ ranh giới hỗ trợ: Cố vấn & Đánh giá (Coaching & Advisory), không làm bài hộ (Điều 5).
- Nắm rõ cách thức hoạt động của Ví VND và Credit lượt đánh giá (Điều 6).
- Kiểm tra điều kiện hoàn tiền 100% tự động hoặc khi hủy hồ sơ (Điều 7).
- Nắm các quy tắc ứng xử, hành vi bị nghiêm cấm và chế tài tài khoản (Điều 8).
- Lấy thông tin liên hệ hỗ trợ pháp lý/điều khoản khi có thắc mắc.

### Business/Product goals
- Xác lập thỏa thuận pháp lý ràng buộc giữa người dùng và Nexus Platform (nguồn: `apps/web-1/app/terms/page.tsx:30`).
- Bảo vệ tài sản trí tuệ độc quyền của Nexus Platform bao gồm mã nguồn, thuật toán, giao diện, logo và cấu trúc báo cáo (nguồn: `apps/web-1/app/terms/page.tsx:104-105`).
- Cam kết bảo mật dữ liệu ý tưởng người dùng, không sử dụng để huấn luyện (train) các mô hình LLM công khai (nguồn: `apps/web-1/app/terms/page.tsx:101-102`).
- Minh bạch hóa chính sách thanh toán, khấu trừ, hoàn tiền và mức trần bồi thường trách nhiệm pháp lý (nguồn: `apps/web-1/app/terms/page.tsx:127-158,183-195`).
- Ngăn chặn các hành vi gian lận học thuật, tấn công hệ thống (bot/scraper/sybil attack) (nguồn: `apps/web-1/app/terms/page.tsx:115,163-177`).

### Primary action
- Đọc nội dung điều khoản và điều hướng nhanh qua Mục lục điều khoản (TOC) ở sidebar cố định.

### Secondary actions
- Bấm liên kết "Quay lại trang chủ" trỏ về `/` (nguồn: `PolicyDocumentLayout.tsx:80-86`).
- Bấm địa chỉ email liên hệ hỗ trợ điều khoản `phungluuhoanglong@gmail.com` (nguồn: `PolicyDocumentLayout.tsx:144-149`).
- Bấm nút "Đăng nhập" trên Header chuyển sang `/auth` (nguồn: `AppShell.tsx:76-85`).
- Chuyển đổi giao diện Sáng / Tối qua `ThemeToggler` (nguồn: `ThemeToggler.tsx:23-32`).
- Điều hướng tới các trang chính sách khác ở Footer: `/privacy`, `/refund-policy`, `/fair-use-policy` (nguồn: `AppShell.tsx:50-55`).
- Bấm biểu tượng mạng xã hội Facebook dẫn tới Fanpage Nexus (nguồn: `AppShell.tsx:168-182`).

### Entry
- Link "Điều khoản sử dụng" tại Footer của tất cả các trang công khai (nguồn: `AppShell.tsx:52`).
- `[Assumption / Cần xác minh]` Người dùng gõ trực tiếp URL `/terms` trên trình duyệt.
- `[Assumption / Cần xác minh]` Người dùng nhấp liên kết dẫn từ luồng đăng ký tài khoản hoặc luồng thanh toán.

### Exit / next step
- Bấm "Quay lại trang chủ" → Chuyển hướng về `/` (nguồn: `PolicyDocumentLayout.tsx:82`).
- Bấm "Đăng nhập" → Chuyển hướng về `/auth` (nguồn: `AppShell.tsx:78`).
- Bấm email hỗ trợ → Mở trình duyệt/trình gửi mail `mailto:phungluuhoanglong@gmail.com` (nguồn: `PolicyDocumentLayout.tsx:145`).
- Bấm Footer link → Chuyển hướng tới `/privacy`, `/refund-policy`, `/fair-use-policy` (nguồn: `AppShell.tsx:51,53,54`).

### Product facts / constraints
- Metadata trang định nghĩa tiêu đề `"Điều khoản dịch vụ | Nexus Platform"` và mô tả tóm tắt (nguồn: `apps/web-1/app/terms/page.tsx:7-11`).
- Ngày cập nhật lần cuối: `30/08/2026`, Phiên bản: `2026-08-v2.0` (nguồn: `apps/web-1/app/terms/page.tsx:31-32`).
- Mục lục văn bản gồm 10 điều khoản tương ứng 10 thẻ section có ID neo cố định: `#dieu-1-gioi-thieu` đến `#dieu-10-giai-quyet-tranh-chap` (nguồn: `apps/web-1/app/terms/page.tsx:13-24`).
- Email liên hệ hỗ trợ điều khoản hiển thị cố định ở sidebar là `phungluuhoanglong@gmail.com` (nguồn: `PolicyDocumentLayout.tsx:148`).
- Định nghĩa bản chất dịch vụ là `Cố vấn & Đánh giá (Coaching & Advisory)`, không cam kết kết quả điểm số hay bảo đảm đậu dự án từ phía hội đồng/trường đại học (nguồn: `apps/web-1/app/terms/page.tsx:115,119`).
- Cam kết bảo mật ý tưởng người dùng: Không sao chép, bán, hoặc dùng ý tưởng để huấn luyện các mô hình LLM công khai bên thứ ba (nguồn: `apps/web-1/app/terms/page.tsx:101-102`).
- Số dư trong Ví VND không có thời hạn hết hạn; Credit mua có thời hạn sử dụng quy định (mặc định 12 tháng) (nguồn: `apps/web-1/app/terms/page.tsx:131-135`).
- Khấu trừ Credit/tiền chỉ diễn ra khi báo cáo đã xuất bản thành công (trạng thái `"Report Ready"`) (nguồn: `apps/web-1/app/terms/page.tsx:137-138`).
- Hoàn tiền 100% tự động khi Admin hoặc Supporter từ chối (Veto) yêu cầu hỗ trợ hoặc vi phạm SLA; hoàn tiền 100% khi người dùng hủy ở trạng thái `pending` hoặc `assigned`; không hoàn tiền khi đã `completed` (nguồn: `apps/web-1/app/terms/page.tsx:149-153`).
- Rút tiền mặt (Withdrawal) từ Ví VND mất từ 3-7 ngày làm việc; Credit khuyến mãi/tặng thưởng không có giá trị quy đổi thành tiền mặt (nguồn: `apps/web-1/app/terms/page.tsx:154-156`).
- Mức trần bồi thường tối đa của Nexus không vượt quá tổng số tiền người dùng đã thanh toán thực tế cho dịch vụ gây ra khiếu nại trong 6 tháng gần nhất (nguồn: `apps/web-1/app/terms/page.tsx:192-194`).
- Cơ quan tài phán giải quyết tranh chấp: Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh, Việt Nam (nguồn: `apps/web-1/app/terms/page.tsx:208-209`).

---

## Interactive Inventory

### 1. Header & Navigation (Toàn cục)
*Source: `apps/web-1/components/layout/AppShell.tsx`, `apps/web-1/components/ui/Logo.tsx`, `apps/web-1/components/ui/ThemeToggler.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.header.logo.alt` | `Logo` > `img[alt]` (Header desktop) | Alt text | `Nexus Logo` | `/` | default |
| `terms.header.theme.toggle` | `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | `Toggle theme` | Chuyển đổi giao diện Sáng / Tối | default |
| `terms.header.nav.login` | `Button` (Header desktop) | CTA | `Đăng nhập` | `/auth` | default |
| `terms.header.mobile.logo.alt` | `Drawer` > `Logo` > `img[alt]` (Menu mobile) | Alt text | `Nexus Logo` | `/` | default |
| `terms.header.mobile.nav.login` | `Drawer` > `Button` (Menu mobile) | CTA | `Đăng nhập` | `/auth` | default |

---

### 2. Document Header & Metadata
*Source: `apps/web-1/app/terms/page.tsx`, `apps/web-1/components/policy/PolicyDocumentLayout.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.meta.title` | `metadata.title` | Title | `Điều khoản dịch vụ \| Nexus Platform` | — | default |
| `terms.meta.description` | `metadata.description` | Description | `Quy định điều khoản sử dụng dịch vụ, quyền sở hữu trí tuệ, chuẩn mực liêm chính học thuật và trách nhiệm pháp lý của Nexus Platform.` | — | default |
| `terms.doc.back_link` | `PolicyDocumentLayout` > `Link` | Navigation | `Quay lại trang chủ` | `/` | default |
| `terms.doc.title` | `PolicyDocumentLayout` > `Title` (h1) | Heading | `Điều khoản Sử dụng Dịch vụ (Terms of Service)` | — | default |
| `terms.doc.subtitle` | `PolicyDocumentLayout` > `Text` | Description | `Văn bản này cấu thành một thỏa thuận pháp lý ràng buộc giữa bạn và Nexus Platform. Vui lòng đọc kỹ trước khi truy cập hoặc sử dụng các dịch vụ của chúng tôi.` | — | default |
| `terms.doc.effective_date.label` | `PolicyDocumentLayout` > `span` | Label | `Cập nhật lần cuối: ` | — | default |
| `terms.doc.effective_date.value` | `PolicyDocumentLayout` > `strong` | Item | `30/08/2026` | — | default |
| `terms.doc.version.label` | `PolicyDocumentLayout` > `span` | Label | `Phiên bản: ` | — | default |
| `terms.doc.version.value` | `PolicyDocumentLayout` > `strong` | Item | `2026-08-v2.0` | — | default |

---

### 3. Sticky Sidebar Navigation & Support
*Source: `apps/web-1/components/policy/PolicyDocumentLayout.tsx`, `apps/web-1/app/terms/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sidebar.title` | `aside` > `Text` | Heading | `Mục lục điều khoản` | — | default |
| `terms.sidebar.toc_1` | `aside` > `Anchor` (TOC 1) | Navigation | `1. Giới thiệu & Thỏa thuận sử dụng` | `#dieu-1-gioi-thieu` | scroll navigation / active on scroll |
| `terms.sidebar.toc_2` | `aside` > `Anchor` (TOC 2) | Navigation | `2. Định nghĩa thuật ngữ` | `#dieu-2-dinh-nghia` | scroll navigation / active on scroll |
| `terms.sidebar.toc_3` | `aside` > `Anchor` (TOC 3) | Navigation | `3. Tài khoản & Trách nhiệm bảo mật` | `#dieu-3-tai-khoan` | scroll navigation / active on scroll |
| `terms.sidebar.toc_4` | `aside` > `Anchor` (TOC 4) | Navigation | `4. Quyền sở hữu trí tuệ (IP)` | `#dieu-4-so-huu-tri-tue` | scroll navigation / active on scroll |
| `terms.sidebar.toc_5` | `aside` > `Anchor` (TOC 5) | Navigation | `5. Chuẩn mực liêm chính học thuật` | `#dieu-5-liem-chinh-hoc-thuat` | scroll navigation / active on scroll |
| `terms.sidebar.toc_6` | `aside` > `Anchor` (TOC 6) | Navigation | `6. Dịch vụ, Ví & Tín dụng (Credit)` | `#dieu-6-thanh-toan-va-vi` | scroll navigation / active on scroll |
| `terms.sidebar.toc_7` | `aside` > `Anchor` (TOC 7) | Navigation | `7. Chính sách hoàn tiền & Hủy bỏ` | `#dieu-7-hoan-tien` | scroll navigation / active on scroll |
| `terms.sidebar.toc_8` | `aside` > `Anchor` (TOC 8) | Navigation | `8. Quy tắc ứng xử & Hành vi bị cấm` | `#dieu-8-hanh-vi-cam` | scroll navigation / active on scroll |
| `terms.sidebar.toc_9` | `aside` > `Anchor` (TOC 9) | Navigation | `9. Từ chối bảo đảm & Giới hạn trách nhiệm` | `#dieu-9-gioi-han-trach-nhiem` | scroll navigation / active on scroll |
| `terms.sidebar.toc_10` | `aside` > `Anchor` (TOC 10) | Navigation | `10. Luật điều chỉnh & Giải quyết tranh chấp` | `#dieu-10-giai-quyet-tranh-chap` | scroll navigation / active on scroll |
| `terms.sidebar.support.prompt` | `aside` > `div` > `p` | Helper | `Cần hỗ trợ về điều khoản?` | — | default |
| `terms.sidebar.support.email` | `aside` > `div` > `a` | CTA | `phungluuhoanglong@gmail.com` | `mailto:phungluuhoanglong@gmail.com` | default |

---

### 4. Điều 1: Giới thiệu & Thỏa thuận sử dụng
*Source: `apps/web-1/app/terms/page.tsx:37-47`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec1.title` | `section#dieu-1-gioi-thieu` > `Title` (h2) | Heading | `1. Giới thiệu & Thỏa thuận sử dụng` | — | default |
| `terms.sec1.p1` | `section#dieu-1-gioi-thieu` > `p:nth-of-type(1)` | Description | `Chào mừng bạn đến với Nexus Platform ("Nexus", "Nền tảng", "Chúng tôi"). Nexus là một nền tảng giáo dục công nghệ (EdTech) cung cấp giải pháp hỗ trợ cấu trúc hóa ý tưởng, phản biện tài liệu khởi nghiệp và nâng cao năng lực hoàn thiện hồ sơ dự án cho sinh viên.` | — | default |
| `terms.sec1.p2` | `section#dieu-1-gioi-thieu` > `p:nth-of-type(2)` | Description | `Bằng việc nhấp vào nút "Đăng ký", "Tôi đồng ý", hoặc bằng việc truy cập, duyệt web, và sử dụng bất kỳ dịch vụ nào do Nexus cung cấp, bạn (người dùng) xác nhận rằng bạn đã đủ năng lực hành vi dân sự, đã đọc, hiểu rõ, và đồng ý bị ràng buộc bởi toàn bộ nội dung của Điều khoản Dịch vụ này cùng với Chính sách Bảo mật của chúng tôi. Nếu bạn không đồng ý với bất kỳ phần nào của thỏa thuận này, bạn không được phép sử dụng dịch vụ của Nexus.` | — | default |

---

### 5. Điều 2: Định nghĩa thuật ngữ
*Source: `apps/web-1/app/terms/page.tsx:50-68`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec2.title` | `section#dieu-2-dinh-nghia` > `Title` (h2) | Heading | `2. Định nghĩa thuật ngữ` | — | default |
| `terms.sec2.item_user` | `section#dieu-2-dinh-nghia` > `p:nth-of-type(1)` | Item | `Người dùng (User / Sinh viên): Bất kỳ cá nhân hoặc tổ chức nào tạo tài khoản và sử dụng dịch vụ của Nexus Platform để nhận tư vấn, đánh giá hoặc quản lý dự án.` | — | default |
| `terms.sec2.item_case` | `section#dieu-2-dinh-nghia` > `p:nth-of-type(2)` | Item | `Hồ sơ hỗ trợ (Case): Không gian làm việc kỹ thuật số khép kín được tạo ra cho một dự án hoặc yêu cầu cụ thể, dùng để lưu trữ tài liệu, trao đổi thông tin và phân phối báo cáo kết quả.` | — | default |
| `terms.sec2.item_supporter` | `section#dieu-2-dinh-nghia` > `p:nth-of-type(3)` | Item | `Người hỗ trợ chuyên môn (Supporter): Đội ngũ chuyên gia, cố vấn hoặc cá nhân có năng lực chuyên môn được Nexus ủy quyền để tiếp nhận case, phân tích tài liệu, và cung cấp phản biện cho Người dùng.` | — | default |
| `terms.sec2.item_services` | `section#dieu-2-dinh-nghia` > `p:nth-of-type(4)` | Item | `Dịch vụ (Services): Bao gồm quyền truy cập phần mềm nền tảng web, các công cụ phân tích bằng Trí tuệ Nhân tạo (AI), hệ thống thanh toán, dịch vụ cố vấn trực tiếp hoặc bất kỳ sản phẩm nào khác do Nexus cung cấp.` | — | default |

---

### 6. Điều 3: Tài khoản & Trách nhiệm bảo mật
*Source: `apps/web-1/app/terms/page.tsx:71-86`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec3.title` | `section#dieu-3-tai-khoan` > `Title` (h2) | Heading | `3. Tài khoản & Trách nhiệm bảo mật` | — | default |
| `terms.sec3.item_1` | `section#dieu-3-tai-khoan` > `p:nth-of-type(1)` | Item | `3.1. Đăng ký tài khoản: Để sử dụng dịch vụ, bạn phải đăng ký tài khoản và cung cấp thông tin chính xác, đầy đủ, và cập nhật. Việc sử dụng danh tính giả mạo là vi phạm nghiêm trọng Điều khoản này.` | — | default |
| `terms.sec3.item_2` | `section#dieu-3-tai-khoan` > `p:nth-of-type(2)` | Item | `3.2. Trách nhiệm bảo mật: Bạn hoàn toàn chịu trách nhiệm duy trì tính bảo mật của thông tin đăng nhập (email, mật khẩu). Nexus sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh từ việc bạn không bảo vệ được thông tin tài khoản của mình. Mọi hoạt động diễn ra dưới tài khoản của bạn sẽ được coi là do bạn thực hiện hoặc ủy quyền.` | — | default |
| `terms.sec3.item_3` | `section#dieu-3-tai-khoan` > `p:nth-of-type(3)` | Item | `3.3. Sử dụng cá nhân: Tài khoản là định danh cá nhân. Bạn không được phép chuyển nhượng, cho thuê, hoặc chia sẻ quyền truy cập tài khoản của mình cho bất kỳ bên thứ ba nào.` | — | default |

---

### 7. Điều 4: Quyền Sở hữu Trí tuệ (Intellectual Property Rights)
*Source: `apps/web-1/app/terms/page.tsx:89-107`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec4.title` | `section#dieu-4-so-huu-tri-tue` > `Title` (h2) | Heading | `4. Quyền Sở hữu Trí tuệ (Intellectual Property Rights)` | — | default |
| `terms.sec4.item_1` | `section#dieu-4-so-huu-tri-tue` > `p:nth-of-type(1)` | Item | `4.1. Tài sản của Người dùng (User Content): Bạn duy trì toàn quyền sở hữu, tác quyền và quyền sở hữu trí tuệ đối với mọi nội dung do bạn tải lên hệ thống (bao gồm ý tưởng kinh doanh, pitch deck, báo cáo, mã nguồn, bảng tính).` | — | default |
| `terms.sec4.item_2` | `section#dieu-4-so-huu-tri-tue` > `p:nth-of-type(2)` | Item | `4.2. Giấy phép sử dụng hạn chế cấp cho Nexus: Bằng việc tải tài liệu lên hệ thống, bạn chỉ cấp cho Nexus một giấy phép giới hạn, không độc quyền, có thể thu hồi, nhằm mục đích duy nhất là phân tích, lưu trữ và hiển thị nội dung đó để cung cấp dịch vụ phản biện (bao gồm việc xử lý qua các mô hình AI tích hợp của chúng tôi).` | — | default |
| `terms.sec4.item_3` | `section#dieu-4-so-huu-tri-tue` > `p:nth-of-type(3)` | Item | `4.3. Cam kết bảo vệ tính nguyên bản (NDA): Nexus và đội ngũ Supporter cam kết tuân thủ nguyên tắc bảo mật. Chúng tôi KHÔNG sao chép, tái sử dụng, bán, hoặc dùng ý tưởng của bạn để huấn luyện (train) các mô hình ngôn ngữ lớn (LLM) công khai của bên thứ ba.` | — | default |
| `terms.sec4.item_4` | `section#dieu-4-so-huu-tri-tue` > `p:nth-of-type(4)` | Item | `4.4. Tài sản của Nexus: Bản thân Nền tảng, bao gồm mã nguồn, thuật toán, giao diện người dùng, logo, và các báo cáo đánh giá (format và cấu trúc) đều là tài sản trí tuệ độc quyền của Nexus Platform. Bạn không được phép sao chép, dịch ngược (reverse-engineer) hoặc tạo sản phẩm phái sinh từ Nền tảng.` | — | default |

---

### 8. Điều 5: Chuẩn mực Liêm chính Học thuật
*Source: `apps/web-1/app/terms/page.tsx:110-122`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec5.title` | `section#dieu-5-liem-chinh-hoc-thuat` > `Title` (h2) | Heading | `5. Chuẩn mực Liêm chính Học thuật` | — | default |
| `terms.sec5.intro` | `section#dieu-5-liem-chinh-hoc-thuat` > `p:nth-of-type(1)` | Description | `Nexus duy trì lập trường không khoan nhượng đối với hành vi gian lận học thuật. Dịch vụ của chúng tôi mang tính chất Cố vấn & Đánh giá (Coaching & Advisory), tuyệt đối không phải là dịch vụ làm thuê hay học thay.` | — | default |
| `terms.sec5.bullet_1` | `section#dieu-5-liem-chinh-hoc-thuat` > `div > p:nth-of-type(1)` | Item | `Giới hạn can thiệp: Supporter và công cụ AI của Nexus sẽ chỉ ra các lỗ hổng logic, lỗi cấu trúc, tính khả thi của dự án và gợi ý hướng cải thiện. Sinh viên bắt buộc phải là người tự nghiên cứu, đưa ra quyết định và tự tay hoàn thiện sản phẩm cuối cùng.` | — | default |
| `terms.sec5.bullet_2` | `section#dieu-5-liem-chinh-hoc-thuat` > `div > p:nth-of-type(2)` | Item | `Không cam kết kết quả đánh giá cuối cùng: Nexus không đảm bảo, không hứa hẹn bất kỳ mức điểm số, giải thưởng hay sự chấp thuận nào từ phía trường đại học, ban giám khảo hay nhà đầu tư.` | — | default |
| `terms.sec5.bullet_3` | `section#dieu-5-liem-chinh-hoc-thuat` > `div > p:nth-of-type(3)` | Item | `Trách nhiệm cá nhân: Sinh viên chịu trách nhiệm 100% đối với sản phẩm nộp cho cơ sở giáo dục, đảm bảo không vi phạm quy chế đạo văn (plagiarism) hay các chính sách học thuật của nhà trường.` | — | default |

---

### 9. Điều 6: Dịch vụ, Ví & Tín dụng (Credit)
*Source: `apps/web-1/app/terms/page.tsx:125-140`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec6.title` | `section#dieu-6-thanh-toan-va-vi` > `Title` (h2) | Heading | `6. Dịch vụ, Ví & Tín dụng (Credit)` | — | default |
| `terms.sec6.item_1` | `section#dieu-6-thanh-toan-va-vi` > `p:nth-of-type(1)` | Item | `6.1. Đơn vị tiền tệ và Ví VND: Mọi giao dịch nạp tiền được xử lý bằng Việt Nam Đồng (VND) thông qua các cổng thanh toán hợp pháp (VD: SePay, VietQR). Số dư trong ví VND không có thời hạn hết hạn.` | — | default |
| `terms.sec6.item_2` | `section#dieu-6-thanh-toan-va-vi` > `p:nth-of-type(2)` | Item | `6.2. Credit (Lượt đánh giá): Dịch vụ phản biện được thanh toán thông qua Credit hoặc trừ trực tiếp từ Ví VND. Credit đã mua có thời hạn sử dụng quy định tại thời điểm mua (mặc định 12 tháng nếu không có ghi chú khác).` | — | default |
| `terms.sec6.item_3` | `section#dieu-6-thanh-toan-va-vi` > `p:nth-of-type(3)` | Item | `6.3. Khấu trừ: Hệ thống chỉ chính thức khấu trừ Credit hoặc tiền trong Ví khi báo cáo đánh giá đã được Supporter hoàn thiện và xuất bản thành công (trạng thái "Report Ready").` | — | default |

---

### 10. Điều 7: Chính sách Hoàn tiền & Hủy bỏ
*Source: `apps/web-1/app/terms/page.tsx:143-158`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec7.title` | `section#dieu-7-hoan-tien` > `Title` (h2) | Heading | `7. Chính sách Hoàn tiền & Hủy bỏ` | — | default |
| `terms.sec7.item_1` | `section#dieu-7-hoan-tien` > `p:nth-of-type(1)` | Item | `Hoàn tiền 100% tự động: Trong trường hợp Quản trị viên (Admin) hoặc Supporter từ chối (Veto) yêu cầu hỗ trợ do không đủ dữ liệu, vượt quá phạm vi chuyên môn, hoặc hệ thống quá tải vi phạm SLA (Cam kết thời gian dịch vụ), 100% số tiền/Credit sẽ được hoàn trả lập tức vào Ví của người dùng.` | — | default |
| `terms.sec7.item_2` | `section#dieu-7-hoan-tien` > `p:nth-of-type(2)` | Item | `Người dùng chủ động hủy: Nếu bạn hủy Case trước khi Supporter bắt đầu quá trình đánh giá (trạng thái pending hoặc assigned), hệ thống sẽ hoàn trả 100%. Nếu Case đang trong quá trình thực hiện (in_progress), việc hoàn tiền sẽ do Admin quyết định tùy thuộc vào khối lượng công việc đã hoàn thành. KHÔNG hoàn tiền khi báo cáo đã được xuất bản (completed).` | — | default |
| `terms.sec7.item_3` | `section#dieu-7-hoan-tien` > `p:nth-of-type(3)` | Item | `Rút tiền mặt (Withdrawal): Số dư Ví VND có thể được yêu cầu rút về tài khoản ngân hàng chính chủ. Quá trình đối soát và giải ngân có thể mất từ 3-7 ngày làm việc và có thể chịu phí giao dịch của bên thứ ba. Credit khuyến mãi hoặc được tặng thưởng không có giá trị quy đổi thành tiền mặt.` | — | default |

---

### 11. Điều 8: Quy tắc ứng xử & Hành vi bị cấm (Acceptable Use Policy)
*Source: `apps/web-1/app/terms/page.tsx:161-178`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec8.title` | `section#dieu-8-hanh-vi-cam` > `Title` (h2) | Heading | `8. Quy tắc ứng xử & Hành vi bị cấm (Acceptable Use Policy)` | — | default |
| `terms.sec8.intro` | `section#dieu-8-hanh-vi-cam` > `p:nth-of-type(1)` | Description | `Bạn đồng ý KHÔNG thực hiện hoặc cố gắng thực hiện bất kỳ hành vi nào sau đây:` | — | default |
| `terms.sec8.bullet_1` | `section#dieu-8-hanh-vi-cam` > `div > p:nth-of-type(1)` | Item | `Sử dụng nền tảng cho mục đích bất hợp pháp, lừa đảo, hoặc vi phạm pháp luật hiện hành.` | — | default |
| `terms.sec8.bullet_2` | `section#dieu-8-hanh-vi-cam` > `div > p:nth-of-type(2)` | Item | `Tải lên nội dung chứa mã độc, virus, trojan, hoặc can thiệp vào hoạt động bình thường của hệ thống.` | — | default |
| `terms.sec8.bullet_3` | `section#dieu-8-hanh-vi-cam` > `div > p:nth-of-type(3)` | Item | `Có hành vi quấy rối, xúc phạm, phân biệt đối xử, hoặc sử dụng ngôn từ kích động thù địch đối với Supporter hoặc người dùng khác.` | — | default |
| `terms.sec8.bullet_4` | `section#dieu-8-hanh-vi-cam` > `div > p:nth-of-type(4)` | Item | `Thực hiện các phương thức tự động (bot, scraper, spider) để thu thập trái phép dữ liệu từ nền tảng.` | — | default |
| `terms.sec8.bullet_5` | `section#dieu-8-hanh-vi-cam` > `div > p:nth-of-type(5)` | Item | `Lạm dụng các chính sách dùng thử, gói miễn phí bằng cách tạo hàng loạt tài khoản giả mạo (sybil attack).` | — | default |
| `terms.sec8.outro` | `section#dieu-8-hanh-vi-cam` > `p:nth-of-type(3)` | Description | `Nexus bảo lưu quyền đơn phương từ chối dịch vụ, đóng băng tài khoản hoặc chấm dứt vĩnh viễn quyền truy cập của bạn mà không cần thông báo trước nếu phát hiện vi phạm nghiêm trọng các quy định này.` | — | default |

---

### 12. Điều 9: Từ chối bảo đảm & Giới hạn trách nhiệm
*Source: `apps/web-1/app/terms/page.tsx:181-196`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec9.title` | `section#dieu-9-gioi-han-trach-nhiem` > `Title` (h2) | Heading | `9. Từ chối bảo đảm & Giới hạn trách nhiệm` | — | default |
| `terms.sec9.item_1` | `section#dieu-9-gioi-han-trach-nhiem` > `p:nth-of-type(1)` | Item | `9.1. Từ chối bảo đảm (As Is): Các dịch vụ của Nexus được cung cấp theo nguyên trạng ("AS IS") và theo tình trạng sẵn có ("AS AVAILABLE"). Chúng tôi từ chối mọi bảo đảm, dù rõ ràng hay ngụ ý, bao gồm nhưng không giới hạn ở tính thương mại, sự phù hợp cho một mục đích cụ thể, và việc không vi phạm.` | — | default |
| `terms.sec9.item_2` | `section#dieu-9-gioi-han-trach-nhiem` > `p:nth-of-type(2)` | Item | `9.2. Giới hạn trách nhiệm (Limitation of Liability): Trong phạm vi tối đa được pháp luật cho phép, Nexus, các giám đốc, nhân viên, hoặc đối tác sẽ không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, mang tính hệ quả hoặc thiệt hại do mất dữ liệu, mất doanh thu, hoặc uy tín học thuật phát sinh từ việc bạn sử dụng hoặc không thể sử dụng dịch vụ.` | — | default |
| `terms.sec9.item_3` | `section#dieu-9-gioi-han-trach-nhiem` > `p:nth-of-type(3)` | Item | `9.3. Mức trần bồi thường: Bất chấp mọi quy định khác, tổng trách nhiệm pháp lý của Nexus đối với bất kỳ khiếu nại nào (dù trong hợp đồng hay ngoài hợp đồng) sẽ KHÔNG vượt quá tổng số tiền bạn đã thanh toán thực tế cho Nexus cho dịch vụ cụ thể gây ra khiếu nại đó trong sáu (06) tháng gần nhất.` | — | default |

---

### 13. Điều 10: Luật điều chỉnh & Giải quyết tranh chấp
*Source: `apps/web-1/app/terms/page.tsx:199-214`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.sec10.title` | `section#dieu-10-giai-quyet-tranh-chap` > `Title` (h2) | Heading | `10. Luật điều chỉnh & Giải quyết tranh chấp` | — | default |
| `terms.sec10.item_1` | `section#dieu-10-giai-quyet-tranh-chap` > `p:nth-of-type(1)` | Item | `10.1. Cập nhật điều khoản: Nexus bảo lưu quyền sửa đổi, bổ sung Điều khoản này vào bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải. Việc bạn tiếp tục sử dụng dịch vụ sau khi các thay đổi được công bố đồng nghĩa với việc bạn chấp nhận các điều khoản sửa đổi.` | — | default |
| `terms.sec10.item_2` | `section#dieu-10-giai-quyet-tranh-chap` > `p:nth-of-type(2)` | Item | `10.2. Giải quyết tranh chấp: Mọi tranh chấp, bất đồng phát sinh từ hoặc liên quan đến thỏa thuận này sẽ được ưu tiên giải quyết thông qua thương lượng thiện chí giữa các bên. Nếu không đạt được thỏa thuận trong vòng ba mươi (30) ngày, tranh chấp sẽ được đệ trình giải quyết cuối cùng tại Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh, Việt Nam.` | — | default |
| `terms.sec10.item_3` | `section#dieu-10-giai-quyet-tranh-chap` > `p:nth-of-type(3)` | Item | `10.3. Luật áp dụng: Thỏa thuận này được điều chỉnh và giải thích theo luật pháp của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.` | — | default |

---

### 14. Footer Centered (Toàn cục)
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `terms.footer.logo.alt` | `Logo` > `img[alt]` (Footer) | Alt text | `Nexus Logo` | `/` | default |
| `terms.footer.link.privacy` | `footer` > `Anchor` (Chính sách bảo mật) | Navigation | `Chính sách bảo mật` | `/privacy` | default |
| `terms.footer.link.terms` | `footer` > `Anchor` (Điều khoản sử dụng) | Navigation | `Điều khoản sử dụng` | `/terms` | active / current route |
| `terms.footer.link.refund` | `footer` > `Anchor` (Thanh toán & Hoàn tiền) | Navigation | `Thanh toán & Hoàn tiền` | `/refund-policy` | default |
| `terms.footer.link.fair_use` | `footer` > `Anchor` (Quy chế & Fair-Use) | Navigation | `Quy chế & Fair-Use` | `/fair-use-policy` | default |
| `terms.footer.social.facebook` | `footer` > `ActionIcon[aria-label]` | Aria-label | `Nexus Facebook Page` | `https://www.facebook.com/profile.php?id=61591506814865` | opens external tab |
| `terms.footer.copyright` | `footer` > `Text` | Description | `© 2026 Nexus Platform. Tất cả quyền được bảo lưu.` | — | default (`{new Date().getFullYear()}`) |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Người dùng / Khách hàng / Sinh viên:**
  - Định nghĩa chính thức tại Điều 2: `Người dùng (User / Sinh viên)` (`apps/web-1/app/terms/page.tsx:56`).
  - Tại Điều 5 dùng từ `Sinh viên` (`apps/web-1/app/terms/page.tsx:118,120`).
  - Tại Điều 1 dùng `bạn (người dùng)` (`apps/web-1/app/terms/page.tsx:45`).
- **Hồ sơ / Case:**
  - Định nghĩa chính thức tại Điều 2: `Hồ sơ hỗ trợ (Case)` (`apps/web-1/app/terms/page.tsx:59`).
  - Tại Điều 7.2 dùng `Case` (`apps/web-1/app/terms/page.tsx:152`).
- **Người hỗ trợ chuyên môn / Supporter:**
  - Định nghĩa chính thức tại Điều 2: `Người hỗ trợ chuyên môn (Supporter)` (`apps/web-1/app/terms/page.tsx:62`).
  - Các mục khác gọi ngắn gọn là `Supporter`.
- **Dịch vụ / Định vị:**
  - Bản chất dịch vụ được định nghĩa là `Cố vấn & Đánh giá (Coaching & Advisory)` (Điều 5, `apps/web-1/app/terms/page.tsx:115`).
- **Hình thức thanh toán & Lưu trữ:**
  - Phân biệt giữa `Ví VND` và `Credit (Lượt đánh giá)` (Điều 6, `apps/web-1/app/terms/page.tsx:131,134`).
- **Mã trạng thái hồ sơ:**
  - Xuất hiện trực tiếp trong văn bản pháp lý: `pending`, `assigned`, `in_progress`, `completed` (Điều 7.2, `apps/web-1/app/terms/page.tsx:152`) và trạng thái `"Report Ready"` (Điều 6.3, `apps/web-1/app/terms/page.tsx:137`).

### Hiện trạng kỹ thuật quan sát được
- **Client-side Active Section Tracking:** `PolicyDocumentLayout.tsx` thiết lập listener sự kiện cuộn `scroll` với độ lệch `window.scrollY + 120` để tự động highlight liên kết tương ứng trên thanh điều hướng sidebar (`PolicyDocumentLayout.tsx:40-54`).
- **Smooth Anchor Scroll:** Khi người dùng click vào một mục trong TOC sidebar, hàm `scrollToSection` tính toán khoảng cách vị trí phần tử trừ đi offset 80px và thực hiện cuộn mượt (`window.scrollTo({ top: offsetPosition, behavior: "smooth" })`) (`PolicyDocumentLayout.tsx:56-72`).
- **Kênh hỗ trợ cố định:** Email liên hệ hỗ trợ được gán cứng qua thẻ `<a href="mailto:phungluuhoanglong@gmail.com">` trong component sidebar của `PolicyDocumentLayout.tsx:144-149`.
- **Layout bọc ngoài:** Toàn bộ trang được bao bọc bởi `AppShell`, đảm bảo hiển thị đồng bộ Header (Logo, Theme toggle, Đăng nhập) và Footer (4 link chính sách, Fanpage Facebook, Copyright năm hiện tại).

### Điểm chưa xác minh (Unknowns / Questions)
- `[Cần xác minh]` Địa chỉ email hỗ trợ điều khoản trên sidebar (`phungluuhoanglong@gmail.com` trong `PolicyDocumentLayout.tsx:148`) là email cá nhân của nhà phát triển/sáng lập hay email hỗ trợ pháp lý chính thức của dự án Nexus Platform? Có cần chuyển thành định dạng email tên miền (ví dụ `legal@nexusplatform.vn` hoặc `support@nexusplatform.vn`) không?
- `[Cần xác minh]` Thuật ngữ trạng thái `"Report Ready"` tại Điều 6.3 có đồng nhất với mã trạng thái hồ sơ trong cơ sở dữ liệu (`CaseStatus`: `completed` / `ready`) hay không?
- `[Cần xác minh]` Quy trình rút tiền mặt từ Ví VND (Điều 7.3 quy định đối soát 3-7 ngày làm việc) hiện đã có giao diện / API rút tiền tự động trên hệ thống chưa hay hoàn toàn tiếp nhận và xử lý thủ công qua Admin?
