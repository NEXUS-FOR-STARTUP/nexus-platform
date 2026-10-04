# Page: Landing Page
Route: `/`  
Access: `Public`

---

## Page Context

### User
- **Primary user:** Sinh viên đang chuẩn bị Checkpoint 1 (CP1) (nguồn: `LandingHero.tsx:21-26`).
- **Typical state:** `[Assumption / Cần xác minh]` Đang làm việc theo nhóm, có ý tưởng hoặc draft slide nhưng không chắc đã đủ tốt để bảo vệ trước hội đồng.
- **Knowledge level:** Biết Checkpoint 1 / CP1 là gì, chưa chắc hiểu Nexus hoạt động thế nào.

### User goals
- Hiểu Nexus giúp mình việc gì.
- Biết kết quả mình sẽ nhận được.
- Biết chi phí.
- Quyết định có nên thử hay không.

### Business/Product goals
- Khiến user hiểu value proposition của sản phẩm.
- Quản lý kỳ vọng: Không khiến user hiểu nhầm rằng Nexus đảm bảo pass checkpoint (nguồn: `FAQSection.tsx:11-13`).
- Dẫn dắt người dùng trải nghiệm dịch vụ (trên UI: CTA Hero trỏ về `/dashboard/team-fit`, CTA Pricing trỏ về `/dashboard/intake?packageId=ai-audit`).

### Primary action
- Bấm nút CTA chính trên Hero ("Kiểm tra miễn phí", dẫn tới `/dashboard/team-fit` - bài trắc nghiệm Team-Fit; đích đến dự định thực sự của sản phẩm là Team-Fit hay luồng nộp bài audit: `[Cần xác minh]`).
### Secondary actions
- Xem giá (cuộn xuống `#pricing`).
- Bắt đầu kiểm tra gói Basic AI Audit.
- Đăng nhập (chuyển sang `/auth`).
- Tìm hiểu cách Nexus hoạt động (xem FAQ).
- Gửi tin nhắn liên hệ.

### Entry
- `[Assumption / Cần xác minh]` User có thể đến từ Facebook / bạn bè giới thiệu / link trực tiếp.

### Exit / next step
- Bấm `Kiểm tra miễn phí` → Đi tới `/dashboard/team-fit` (nguồn: `LandingHero.tsx:55`).
- Bấm `Bắt đầu kiểm tra` → Đi tới `/dashboard/intake?packageId=ai-audit` (nguồn: `LandingPricing.tsx:74`).
- Bấm `Đăng nhập` → Đi tới `/auth` (nguồn: `AppShell.tsx:78`).

### Product facts / constraints
- Gói `Basic AI Audit`: Giá 79,000 VND / lượt, thời gian trả kết quả cam kết trên UI là `< 1 phút` (nguồn: `LandingPricing.tsx:43,67`).
- Gói `Premium Mentor Audit`: Giá 149,000 VND / lượt, hiển thị nhãn `Sắp ra mắt`, nút bấm có thuộc tính `disabled` (nguồn: `LandingPricing.tsx:104,134-142`).
- Nexus không đảm bảo chắc chắn đỗ checkpoint (nguồn: `FAQSection.tsx:11-13`).
- Nhận tài liệu phân tích qua link Google Drive (nguồn: `FAQSection.tsx:8`).
- Nút CTA `Kiểm tra miễn phí` trên Hero trỏ tới route `/dashboard/team-fit` (nguồn: `LandingHero.tsx:55`).
- Form liên hệ khi submit gọi `notifications.show` hiển thị thông báo "Tính năng đang phát triển", không gửi dữ liệu về backend (nguồn: `ContactUs.tsx:9-17`).

---

## Interactive Inventory

### 1. Header & Navigation
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `header.logo.alt` | `Logo` > `img[alt]` (Header desktop) | Alt text | `Nexus Logo` | `/` | default |
| `header.theme.toggle` | `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | `Toggle theme` | Chuyển đổi theme Sáng/Tối | default |
| `header.nav.login` | `Button` (Header desktop) | CTA | `Đăng nhập` | `/auth` | default |
| `header.mobile.logo_alt` | `Logo` > `img[alt]` (Drawer mobile) | Alt text | `Nexus Logo` | `/` | default |
| `header.mobile.login` | `Drawer` > `Button` (Mobile menu) | CTA | `Đăng nhập` | `/auth` | default |

---

### 2. Hero Section
*Source: `apps/web-1/components/landing/LandingHero.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hero.title.line1` | `Title` (h1 - Dòng 1) | Heading | `Kiểm định Ý tưởng & Đánh giá` | — | default |
| `hero.title.highlight` | `span.highlight` (h1 - Điểm nhấn) | Heading | `Checkpoint 1` | — | default |
| `hero.description` | `Text` (Mô tả phụ) | Description | `Nexus giúp các nhóm sinh viên kiểm định nội dung Checkpoint 1 (CP1) theo đúng tiêu chí chấm điểm học thuật, phát hiện lỗi logic lập luận bằng AI và nhận phản biện thực tế từ Supporter giàu kinh nghiệm.` | — | default |
| `hero.bullet_1.title` | `List.Item > b` (Bullet 1 - Tiêu đề) | Item | `Đánh giá tiêu chí Checkpoint` | — | default |
| `hero.bullet_1.desc` | `List.Item` (Bullet 1 - Nội dung) | Item | `– Báo cáo chi tiết chỉ ra lỗ hổng lập luận và lỗi logic.` | — | default |
| `hero.bullet_2.title` | `List.Item > b` (Bullet 2 - Tiêu đề) | Item | `Minh chứng thuyết phục` | — | default |
| `hero.bullet_2.desc` | `List.Item` (Bullet 2 - Nội dung) | Item | `– Định vị bằng chứng cụ thể trong slide/tài liệu của bạn.` | — | default |
| `hero.bullet_3.title` | `List.Item > b` (Bullet 3 - Tiêu đề) | Item | `Đồng hành cùng Supporter` | — | default |
| `hero.bullet_3.desc` | `List.Item` (Bullet 3 - Nội dung) | Item | `– Báo cáo được chỉnh sửa, hoàn thiện bởi giảng viên/mentor.` | — | default |
| `hero.cta.free` | `Button` (Primary CTA) | CTA | `Kiểm tra miễn phí` | `/dashboard/team-fit` | public link (no auth guard in component) |
| `hero.cta.pricing` | `Button` (Secondary CTA) | Navigation | `Xem bảng giá` | `#pricing` | default |

---

### 3. Core Features Grid
*Source: `apps/web-1/components/landing/FeaturesGrid.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `features.title` | `Title` (h2) | Heading | `Tính năng cốt lõi của Nexus` | — | default |
| `features.subtitle` | `Text` (Mô tả phụ) | Description | `Đồng hành cùng ý tưởng của bạn từ lúc sơ khởi đến khi bảo vệ thành công trước hội đồng.` | — | default |
| `features.item_1.title` | `Card 1 > Text` (Tiêu đề) | Heading | `Phản biện thông minh (AI)` | — | default |
| `features.item_1.desc` | `Card 1 > Text` (Mô tả) | Description | `Phân tích tài liệu slide, đề cương để chỉ ra các điểm thiếu logic và khuyến nghị bổ sung chi tiết.` | — | default |
| `features.item_2.title` | `Card 2 > Text` (Tiêu đề) | Heading | `Mở rộng góc nhìn thực tế` | — | default |
| `features.item_2.desc` | `Card 2 > Text` (Mô tả) | Description | `Các Supporter giàu kinh nghiệm sẽ bổ sung góc nhìn thực tiễn và tinh chỉnh kết quả phản biện.` | — | default |
| `features.item_3.title` | `Card 3 > Text` (Tiêu đề) | Heading | `Theo dõi phiên bản` | — | default |
| `features.item_3.desc` | `Card 3 > Text` (Mô tả) | Description | `Lưu trữ lịch sử nộp bài (v0, v1, v2...) giúp bạn dễ dàng theo dõi tiến độ sửa đổi hồ sơ.` | — | default |
| `features.item_4.title` | `Card 4 > Text` (Tiêu đề) | Heading | `Chuẩn tiêu chí Checkpoint` | — | default |
| `features.item_4.desc` | `Card 4 > Text` (Mô tả) | Description | `Bộ tiêu chí bám sát syllabus học thuật, giúp giảm thiểu rủi ro khi bảo vệ trước hội đồng.` | — | default |

---

### 4. Pricing (Bảng giá dịch vụ)
*Source: `apps/web-1/components/landing/LandingPricing.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pricing.title` | `h2` (Tiêu đề khu vực) | Heading | `Bảng Giá Dịch Vụ` | — | default |
| `pricing.subtitle` | `p` (Mô tả phụ khu vực) | Description | `Lựa chọn gói kiểm tra phù hợp với mục tiêu và tiến độ dự án của bạn. Mọi gói đều được xây dựng dựa trên tiêu chuẩn khởi nghiệp thực chiến.` | — | default |
| `pricing.basic.badge` | `Card[Basic] > Badge` | Badge | `Khuyên dùng` | — | default |
| `pricing.basic.name` | `Card[Basic] > h3` | Heading | `Basic AI Audit` | — | default |
| `pricing.basic.price` | `Card[Basic] > span` | Item | `79,000` | — | default |
| `pricing.basic.unit` | `Card[Basic] > span` | Item | `VND / lượt` | — | default |
| `pricing.basic.desc` | `Card[Basic] > p` | Description | `Phù hợp nhóm cần nộp gấp, rà soát khung sườn và sửa lỗi logic cơ bản nhanh chóng.` | — | default |
| `pricing.basic.feat_1` | `Card[Basic] > List.Item 1` | Item | `Đánh giá hoàn toàn tự động bằng AI` | — | default |
| `pricing.basic.feat_2` | `Card[Basic] > List.Item 2` | Item | `Phân tích theo Rubric chuẩn (5 tiêu chí cốt lõi)` | — | default |
| `pricing.basic.feat_3` | `Card[Basic] > List.Item 3` | Item | `Nhận báo cáo chi tiết ngay lập tức (< 1 phút)` | — | default |
| `pricing.basic.feat_4` | `Card[Basic] > List.Item 4` | Item | `Chỉ ~15,000 VND/bạn (nhóm 5 người)` | — | default |
| `pricing.basic.cta` | `Card[Basic] > Button` | CTA | `Bắt đầu kiểm tra` | `/dashboard/intake?packageId=ai-audit` | public link (no auth guard in component) |
| `pricing.premium.badge` | `Card[Premium] > Badge` | Badge | `Sắp ra mắt` | — | default |
| `pricing.premium.name` | `Card[Premium] > h3` | Heading | `Premium Mentor Audit` | — | default |
| `pricing.premium.price` | `Card[Premium] > span` | Item | `149,000` | — | default |
| `pricing.premium.unit` | `Card[Premium] > span` | Item | `VND / lượt` | — | default |
| `pricing.premium.desc` | `Card[Premium] > p` | Description | `Dành cho dự án nhắm điểm 8-9, cần chuyên gia rà soát ảo giác và định hướng thực chiến.` | — | default |
| `pricing.premium.feat_1` | `Card[Premium] > List.Item 1` | Item | `Bao gồm toàn bộ tính năng của Basic AI` | — | default |
| `pricing.premium.feat_2` | `Card[Premium] > List.Item 2` | Item | `Mentor FPT trực tiếp review và đối chiếu` | — | default |
| `pricing.premium.feat_3` | `Card[Premium] > List.Item 3` | Item | `Ưu tiên chỉ ra các rủi ro chặn (BLOCKER)` | — | default |
| `pricing.premium.feat_4` | `Card[Premium] > List.Item 4` | Item | `Định hướng sửa bài thực chiến (SLA: 24h-48h)` | — | default |
| `pricing.premium.cta` | `Card[Premium] > Button` | CTA | `Sắp ra mắt` | — | disabled |

---

### 5. FAQ (Câu hỏi thường gặp)
*Source: `apps/web-1/components/landing/FAQSection.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `faq.title` | `h2` (Tiêu đề khu vực) | Heading | `Câu hỏi thường gặp (FAQ)` | — | default |
| `faq.subtitle` | `p` (Mô tả phụ) | Description | `Giải đáp các thắc mắc phổ biến về quy trình phản biện ý tưởng trên Nexus.` | — | default |
| `faq.item_1.question` | `Accordion.Control 1` | Item | `Nexus phản biện ý tưởng như thế nào?` | Mở/đóng accordion | default |
| `faq.item_1.answer` | `Accordion.Panel 1` | Description | `Nexus sử dụng AI phân tích tài liệu (link Drive của bạn) đối chiếu với các tiêu chí đánh giá checkpoint. Kết quả là bản báo cáo chi tiết chỉ ra các lỗ hổng lập luận, bằng chứng thiếu sót, và gợi ý giải pháp cải thiện.` | — | default |
| `faq.item_2.question` | `Accordion.Control 2` | Item | `Báo cáo của Nexus có đảm bảo tôi sẽ pass checkpoint không?` | Mở/đóng accordion | default |
| `faq.item_2.answer` | `Accordion.Panel 2` | Description | `Không. Nexus là công cụ phản biện và hỗ trợ hoàn thiện tài liệu, giúp bạn chuẩn bị tốt nhất. Kết quả cuối cùng phụ thuộc vào hội đồng đánh giá và khả năng thuyết trình của đội ngũ.` | — | default |
| `faq.item_3.question` | `Accordion.Control 3` | Item | `Vai trò của Supporter trên hệ thống là gì?` | Mở/đóng accordion | default |
| `faq.item_3.answer` | `Accordion.Panel 3` | Description | `Supporter là các chuyên gia, giảng viên hoặc mentor có kinh nghiệm. Họ sẽ xem xét bản draft phản biện của AI, điều chỉnh, bổ sung ý kiến thực tế để xuất bản báo cáo chất lượng nhất cho hồ sơ của bạn.` | — | default |
| `faq.item_4.question` | `Accordion.Control 4` | Item | `Tôi có thể chỉnh sửa ý tưởng sau khi nhận phản biện không?` | Mở/đóng accordion | default |
| `faq.item_4.answer` | `Accordion.Panel 4` | Description | `Có. Hệ thống hỗ trợ quy trình cập nhật phiên bản (v00, v01, v02...). Bạn có thể nộp bản chỉnh sửa dựa trên phản biện để chạy đánh giá vòng tiếp theo.` | — | default |
| `faq.item_5.question` | `Accordion.Control 5` | Item | `Nexus bảo mật thông tin ý tưởng của tôi như thế nào?` | Mở/đóng accordion | default |
| `faq.item_5.answer` | `Accordion.Panel 5` | Description | `Mọi thông tin ý tưởng và tài liệu Drive của bạn đều được bảo mật nghiêm ngặt. Chúng tôi chỉ sử dụng dữ liệu này cho mục đích phản biện và không chia sẻ cho bên thứ ba.` | — | default |

---

### 6. Contact Us (Liên hệ)
*Source: `apps/web-1/components/landing/ContactUs.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `contact.title` | `Title` (h2) | Heading | `Liên hệ với chúng tôi` | — | default |
| `contact.subtitle` | `Text` (Mô tả phụ) | Description | `Mọi thắc mắc hoặc yêu cầu hỗ trợ đặc biệt, xin vui lòng gửi tin nhắn hoặc liên hệ trực tiếp.` | — | default |
| `contact.info.title` | `Card > Title` (h4) | Heading | `Thông tin liên hệ` | — | default |
| `contact.info.desc` | `Card > Text` | Description | `Nexus luôn sẵn sàng giải đáp và lắng nghe các phản hồi của bạn.` | — | default |
| `contact.info.email_label` | `div` (Nhãn Email) | Label | `Email` | — | default |
| `contact.info.email_val` | `div` (Giá trị Email) | Item | `phungluuhoanglong@gmail.com` | — | default |
| `contact.info.phone_label` | `div` (Nhãn Hotline) | Label | `Hotline` | — | default |
| `contact.info.phone_val` | `div` (Giá trị Hotline) | Item | `0776 506 822` | — | default |
| `contact.info.fb_label` | `div` (Nhãn Fanpage) | Label | `Fanpage Facebook` | — | default |
| `contact.info.fb_link` | `span` (Tên link Fanpage) | Navigation | `Nexus Platform` | `https://www.facebook.com/profile.php?id=61591506814865` | default |
| `contact.form.name_label` | `TextInput[label]` | Label | `Họ tên` | — | default |
| `contact.form.name_placeholder` | `TextInput[placeholder]` | Placeholder | `Họ tên của bạn` | — | default |
| `contact.form.email_label` | `TextInput[label]` | Label | `Email` | — | default |
| `contact.form.email_placeholder` | `TextInput[placeholder]` | Placeholder | `email@example.com` | — | default |
| `contact.form.subject_label` | `TextInput[label]` | Label | `Tiêu đề` | — | default |
| `contact.form.subject_placeholder` | `TextInput[placeholder]` | Placeholder | `Lời nhắn về chủ đề gì?` | — | default |
| `contact.form.msg_label` | `Textarea[label]` | Label | `Nội dung tin nhắn` | — | default |
| `contact.form.msg_placeholder` | `Textarea[placeholder]` | Placeholder | `Viết lời nhắn của bạn ở đây...` | — | default |
| `contact.form.submit_btn` | `Button` (Gửi tin nhắn) | CTA | `Gửi tin nhắn` | Form submit | default |
| `contact.toast.title` | `notifications.show` | Toast | `Chức năng đang phát triển` | Hiển thị toast thông báo | client toast trigger |
| `contact.toast.message` | `notifications.show` | Toast | `Tính năng gửi liên hệ đang được phát triển. Vui lòng liên hệ trực tiếp qua Email hoặc Hotline bên cạnh.` | Hiển thị toast thông báo | client toast trigger |

---

### 7. Footer
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `footer.logo.alt` | `Logo` > `img[alt]` | Alt text | `Nexus Logo` | `/` | default |
| `footer.link.privacy` | `Anchor` | Navigation | `Chính sách bảo mật` | `/privacy` | default |
| `footer.link.terms` | `Anchor` | Navigation | `Điều khoản sử dụng` | `/terms` | default |
| `footer.link.refund` | `Anchor` | Navigation | `Thanh toán & Hoàn tiền` | `/refund-policy` | default |
| `footer.link.fair_use` | `Anchor` | Navigation | `Quy chế & Fair-Use` | `/fair-use-policy` | default |
| `footer.social.fb_label` | `ActionIcon[aria-label]` | Aria-label | `Nexus Facebook Page` | `https://www.facebook.com/...` | default |
| `footer.copyright` | `Text` | Description | `© {new Date().getFullYear()} Nexus Platform. Tất cả quyền được bảo lưu.` | — | default |

---

## Notes

- **"Checkpoint 1" / "CP1"** là thuật ngữ user mục tiêu quen thuộc trong bối cảnh làm đề án học tập (nguồn: `LandingHero.tsx:21-26`).
- **Terminology quan sát được trên trang:**
  - Vai trò người phản biện xuất hiện với nhiều cách gọi: `Supporter` (`LandingHero.tsx:26,47`, `FeaturesGrid.tsx:16`, `FAQSection.tsx:15`), `giảng viên/mentor` (`LandingHero.tsx:47`), `Mentor FPT` (`LandingPricing.tsx:127`), `chuyên gia, giảng viên hoặc mentor` (`FAQSection.tsx:16`).
  - Lượt đánh giá được gọi xen kẽ: `Kiểm định` (`LandingHero.tsx:21,26`), `Phản biện` (`FeaturesGrid.tsx:9,16`), `Kiểm tra` (`LandingPricing.tsx:18,81`), `Audit` (`LandingPricing.tsx:39,100`).
  - Đơn vị đề tài được gọi là: `Hồ sơ` (`FeaturesGrid.tsx:22`), `Ý tưởng` (`LandingHero.tsx:21`), `Dự án` (`LandingPricing.tsx:19,111`).
- **Code behavior quan sát được:**
  - Component `LandingHero`: Nút `"Kiểm tra miễn phí"` có prop `href="/dashboard/team-fit"` (nguồn: `LandingHero.tsx:55`).
  - Component `ContactUs`: Hàm `handleSubmit` gọi `notifications.show` hiển thị toast thông báo chức năng đang phát triển và reset form, không có lời gọi API (nguồn: `ContactUs.tsx:9-17`).
  - Component `LandingPricing`: Thẻ `Premium Mentor Audit` có thuộc tính `disabled` trên Button và gắn nhãn `Sắp ra mắt` (nguồn: `LandingPricing.tsx:134-142`).
- **Điểm chưa xác minh (Unknowns / Questions):**
  - Trải nghiệm chuyển hướng khi người dùng chưa đăng nhập bấm vào `/dashboard/team-fit` hoặc `/dashboard/intake` (hệ thống có middleware chặn hay component tự redirect?).
  - `Supporter` và `Mentor` trong mô hình vận hành của Nexus là hai vai trò riêng biệt hay cùng một role.
