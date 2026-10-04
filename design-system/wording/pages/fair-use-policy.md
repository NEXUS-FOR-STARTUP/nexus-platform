# Page: Chính sách Vận hành & Sử dụng Công bằng (Fair Use Policy)
Route: `/fair-use-policy`  
Access: `Public`

---

## Page Context

### User
- **Primary user:** Sinh viên sử dụng Nexus Platform (đặc biệt là người dùng gói miễn phí Team-Fit hoặc chuẩn bị nộp bài), Supporter và Quản trị viên cần tra cứu quy chế vận hành.
- **Typical state:** `[Assumption / Cần xác minh]` Đang tìm hiểu về giới hạn tài nguyên của gói miễn phí, lý do hồ sơ bị từ chối/đóng, cam kết thời gian phản hồi (SLA) hoặc các quy định về an toàn hạ tầng và chế tài xử lý vi phạm của hệ thống.
- **Knowledge level:** Có thể là người dùng mới bắt đầu trải nghiệm gói miễn phí, hoặc người dùng có hồ sơ bị từ chối/đóng muốn tra cứu quy định cụ thể.

### User goals
- Hiểu rõ bản chất và hạn mức của gói miễn phí (tối đa 3 hồ sơ trong toàn bộ vòng đời tài khoản).
- Nắm được các hành vi lạm dụng bị cấm (Sybil attack, automation spam, prompt injection).
- Tra cứu bảng mã lý do đóng/từ chối hồ sơ minh bạch (Taxonomy: `INACTIVE_TIMEOUT`, `DUPLICATE_CASE`, `INSUFFICIENT_DATA`, `OUT_OF_SCOPE`, `VIOLATION_POLICY`).
- Kiểm tra cam kết thời gian phản hồi (SLA 24 - 48 giờ làm việc) và điều kiện tự động hoàn tiền 100% khi vi phạm SLA.
- Hiểu thuật toán xếp hàng thông minh và cơ chế chấm điểm ưu tiên (Priority Score).
- Nắm rõ 3 cấp độ chế tài xử lý vi phạm.
- Tìm kênh liên hệ hỗ trợ về điều khoản (`phungluuhoanglong@gmail.com`).

### Business/Product goals
- Bảo vệ tài nguyên hạ tầng phân tích AI (chi phí token trả phí cho OpenAI và Google).
- Ngăn chặn tình trạng spam tài khoản ảo (Sybil attack), bot tự động làm tắc nghẽn hàng đợi, và prompt injection thao túng AI.
- Chuẩn hóa quy trình vận hành giữa Supporter / Admin và sinh viên khi tiếp nhận, đánh giá hoặc từ chối hồ sơ để tránh khiếu nại, tranh chấp.
- Minh bạch hóa cam kết chất lượng dịch vụ (SLA 24 - 48h) và cơ chế hoàn tiền tự động 100% nếu trễ hạn mà không có lý do chính đáng.
- Thiết lập chế tài nghiêm khắc bảo vệ quyền lợi và sự tôn nghiêm của đội ngũ Supporter (nghiêm cấm gian lận đạo văn, xúc phạm Supporter).

### Primary action
- Đọc, tra cứu các điều khoản quy định vận hành và sử dụng công bằng tài nguyên.

### Secondary actions
- Nhấp mục lục (TOC ở sidebar desktop) để cuộn nhanh đến điều khoản tương ứng (`#dieu-1-muc-dich`, `#dieu-2-fair-use`, `#dieu-3-chong-lam-dung`, `#dieu-4-dong-ho-so`, `#dieu-5-cam-ket-sla`, `#dieu-6-che-tai`).
- Bấm nút "Quay lại trang chủ" (về `/`).
- Bấm "Đăng nhập" trên Header (chuyển sang `/auth`).
- Bấm liên kết email `phungluuhoanglong@gmail.com` ở sidebar để gửi thắc mắc về điều khoản.
- Điều hướng qua các liên kết Footer (`/privacy`, `/terms`, `/refund-policy`, `/fair-use-policy`, fanpage Facebook).
- Chuyển đổi giao diện Sáng/Tối (Theme Toggler).

### Entry
- `[Assumption / Cần xác minh]` Người dùng click vào liên kết "Quy chế & Fair-Use" ở Footer của các trang (`AppShell.tsx:54`).
- `[Assumption / Cần xác minh]` Người dùng nhận được thông báo từ chối hồ sơ kèm mã lý do hoặc link dẫn đến điều khoản trong dashboard.
- `[Assumption / Cần xác minh]` Truy cập trực tiếp qua đường dẫn `/fair-use-policy`.

### Exit / next step
- Bấm `Quay lại trang chủ` → Về `/` (nguồn: `PolicyDocumentLayout.tsx:81-86`).
- Bấm `Đăng nhập` → Chuyển sang `/auth` (nguồn: `AppShell.tsx:78`).
- Bấm link email → Mở ứng dụng mail gửi tới `phungluuhoanglong@gmail.com` (nguồn: `PolicyDocumentLayout.tsx:145`).
- Bấm các liên kết Footer → Chuyển sang trang chính sách tương ứng hoặc fanpage Facebook (nguồn: `AppShell.tsx:50-55,168-182`).

### Product facts / constraints
- Gói đánh giá miễn phí: Gói Đánh giá mức độ phù hợp Nhóm - Ý tưởng (Team-Idea Fit) được cung cấp miễn phí (nguồn: `page.tsx:49`).
- Hạn mức gói miễn phí: Mỗi tài khoản định danh hợp lệ chỉ được phép khởi tạo tối đa ba (03) hồ sơ miễn phí trong toàn bộ vòng đời tài khoản (nguồn: `page.tsx:52`).
- Cơ chế vượt hạn mức: Khi hết hạn mức, tính năng tạo hồ sơ miễn phí tự động bị khóa; người dùng cần nâng cấp lên các gói phân tích chuyên sâu trả phí (Paid Packages) (nguồn: `page.tsx:55`).
- Hạ tầng AI: Hệ thống trả phí trên mỗi truy vấn API (Token) cho OpenAI và Google (nguồn: `page.tsx:66`).
- Các hành vi bị cấm: Tấn công Sybil (tạo nhiều tài khoản ảo/clone), Automation Abuse (bot/scraper cào dữ liệu/spam hồ sơ rác làm tắc hàng đợi), Prompt Injection (câu lệnh thao túng điều hướng AI) (nguồn: `page.tsx:69-71`).
- Bảng mã lý do đóng/từ chối hồ sơ (Case Closure Taxonomy) gồm 5 mã:
  1. `INACTIVE_TIMEOUT` (Đóng do bỏ cuộc): Không phản hồi hoặc không nộp bổ sung tài liệu sau 14 ngày liên tục (nguồn: `page.tsx:84`).
  2. `DUPLICATE_CASE` (Hồ sơ trùng lặp): Gửi nhiều hồ sơ cho cùng một nội dung dự án; hồ sơ phụ bị đóng và hoàn tiền (nguồn: `page.tsx:85`).
  3. `INSUFFICIENT_DATA` (Dữ liệu sơ sài): Hồ sơ trống rỗng, không chứa dữ kiện cốt lõi và không cải thiện dù đã nhắc nhở 2 lần (nguồn: `page.tsx:86`).
  4. `OUT_OF_SCOPE` (Ngoài phạm vi cố vấn): Đề tài vi phạm pháp luật, giải bài tập hộ, ngoài chuyên môn khởi nghiệp (nguồn: `page.tsx:87`).
  5. `VIOLATION_POLICY` (Vi phạm nghiêm trọng): Gian lận đạo văn, xúc phạm Supporter; đóng hồ sơ KHÔNG hoàn tiền (nguồn: `page.tsx:88`).
- Cam kết thời gian (SLA): Thời gian phản hồi tiêu chuẩn là từ 24 - 48 giờ làm việc kể từ lúc Supporter chính thức nhận hồ sơ. Vi phạm SLA (trễ quá 48 giờ) không có thông báo chính đáng sẽ được tự động hoàn tiền 100% (nguồn: `page.tsx:99`).
- Thuật toán chấm điểm ưu tiên (Priority Score): Áp dụng theo thời gian thực dựa trên 4 yếu tố: Cấp độ gói dịch vụ, Thời gian chờ đợi, Mức độ khẩn cấp (hạn nộp bài trường), Vòng sửa đổi (resubmission được cộng điểm ưu tiên) (nguồn: `page.tsx:102-107`).
- 3 cấp độ chế tài vi phạm: Cấp độ 1 (email cảnh cáo), Cấp độ 2 (hủy hồ sơ đang xử lý không hoàn tiền, shadow-ban tính năng nộp bài 7-30 ngày), Cấp độ 3 (khóa tài khoản vĩnh viễn, blacklist IP/Fingerprint ở cấp mạng WAF, chặn thanh toán) (nguồn: `page.tsx:120-122`).
- Ngày hiệu lực văn bản: `30/08/2026`, Phiên bản: `2026-08-v2.0` (nguồn: `page.tsx:27-28`).

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

### 2. Document Header & Metadata
*Source: `apps/web-1/components/policy/PolicyDocumentLayout.tsx` & `apps/web-1/app/fair-use-policy/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `doc.head.meta_title` | `metadata.title` | Heading | `Chính sách Vận hành & Sử dụng Công bằng \| Nexus Platform` | — | default |
| `doc.head.meta_desc` | `metadata.description` | Description | `Quy chế hoạt động, giới hạn gói miễn phí (Fair Use), chuẩn hóa lý do đóng hồ sơ và cam kết chất lượng dịch vụ (SLA) của Nexus Platform.` | — | default |
| `doc.header.back_btn` | `Link` (Header tài liệu) | Navigation | `Quay lại trang chủ` | `/` | default |
| `doc.header.title` | `Title` (h1 - Tiêu đề trang) | Heading | `Chính sách Vận hành & Sử dụng Công bằng` | — | default |
| `doc.header.subtitle` | `Text` (Mô tả phụ) | Description | `Tài liệu này xác định các ranh giới vận hành, nguyên tắc phân bổ tài nguyên hệ thống và tiêu chuẩn đánh giá hồ sơ nhằm duy trì một nền tảng khởi nghiệp minh bạch, chất lượng.` | — | default |
| `doc.header.effective_label` | `div > span` | Label | `Cập nhật lần cuối: ` | — | default |
| `doc.header.effective_date` | `div > span > strong` | Item | `30/08/2026` | — | default |
| `doc.header.version_label` | `div > span` | Label | `Phiên bản: ` | — | default |
| `doc.header.version_val` | `div > span > strong` | Item | `2026-08-v2.0` | — | default |

---

### 3. Sidebar Table of Contents & Support
*Source: `apps/web-1/components/policy/PolicyDocumentLayout.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sidebar.toc.title` | `aside > Text` | Heading | `Mục lục điều khoản` | — | default |
| `sidebar.toc.item_1` | `nav > Anchor 1` | Navigation | `1. Mục đích & Tiêu chuẩn hoạt động` | `#dieu-1-muc-dich` | active on scroll / default |
| `sidebar.toc.item_2` | `nav > Anchor 2` | Navigation | `2. Chính sách Sử dụng Công bằng (Fair Use)` | `#dieu-2-fair-use` | active on scroll / default |
| `sidebar.toc.item_3` | `nav > Anchor 3` | Navigation | `3. Phòng chống lạm dụng & Spam API` | `#dieu-3-chong-lam-dung` | active on scroll / default |
| `sidebar.toc.item_4` | `nav > Anchor 4` | Navigation | `4. Chuẩn hóa lý do Đóng/Từ chối Hồ sơ` | `#dieu-4-dong-ho-so` | active on scroll / default |
| `sidebar.toc.item_5` | `nav > Anchor 5` | Navigation | `5. Cam kết Chất lượng & Auto-Priority` | `#dieu-5-cam-ket-sla` | active on scroll / default |
| `sidebar.toc.item_6` | `nav > Anchor 6` | Navigation | `6. Chế tài xử lý vi phạm` | `#dieu-6-che-tai` | active on scroll / default |
| `sidebar.support.label` | `aside > div > p` | Description | `Cần hỗ trợ về điều khoản?` | — | default |
| `sidebar.support.email` | `aside > div > a` | Navigation | `phungluuhoanglong@gmail.com` | `mailto:phungluuhoanglong@gmail.com` | default |

---

### 4. Điều 1: Mục đích & Tiêu chuẩn hoạt động
*Source: `apps/web-1/app/fair-use-policy/page.tsx:33-40`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.sec_1.title` | `section#dieu-1-muc-dich > Title` (h2) | Heading | `1. Mục đích & Tiêu chuẩn hoạt động` | — | default |
| `policy.sec_1.desc` | `section#dieu-1-muc-dich > p` | Description | `Nexus Platform vận hành dựa trên sự kết hợp giữa Trí tuệ Nhân tạo (AI Engine) và Đội ngũ Cố vấn chuyên môn (Human Supporters). Để đảm bảo tính bền vững của hạ tầng và cam kết chất lượng phản biện cao nhất cho mọi sinh viên, chúng tôi thiết lập Chính sách Vận hành & Sử dụng Công bằng (Acceptable & Fair Use Policy) này. Mọi hành vi làm cạn kiệt tài nguyên có chủ đích hoặc sử dụng nền tảng sai mục đích đều bị nghiêm cấm.` | — | default |

---

### 5. Điều 2: Chính sách Sử dụng Công bằng (Fair Use) đối với Gói Miễn phí
*Source: `apps/web-1/app/fair-use-policy/page.tsx:43-58`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.sec_2.title` | `section#dieu-2-fair-use > Title` (h2) | Heading | `2. Chính sách Sử dụng Công bằng (Fair Use) đối với Gói Miễn phí` | — | default |
| `policy.sec_2.item_1.label` | `section#dieu-2-fair-use > div > p:nth-child(1) > strong` | Label | `2.1. Bản chất của Gói Free:` | — | default |
| `policy.sec_2.item_1.text` | `section#dieu-2-fair-use > div > p:nth-child(1)` | Description | `Gói Đánh giá mức độ phù hợp Nhóm - Ý tưởng (Team-Idea Fit) được cung cấp miễn phí nhằm hỗ trợ sinh viên trải nghiệm phương pháp luận của Nexus trước khi đi sâu vào phát triển dự án thực tế.` | — | default |
| `policy.sec_2.item_2.label` | `section#dieu-2-fair-use > div > p:nth-child(2) > strong:nth-child(1)` | Label | `2.2. Hạn mức phần mềm:` | — | default |
| `policy.sec_2.item_2.text_prefix` | `section#dieu-2-fair-use > div > p:nth-child(2)` | Description | `Mỗi tài khoản định danh hợp lệ chỉ được phép khởi tạo tối đa ` | — | default |
| `policy.sec_2.item_2.highlight` | `section#dieu-2-fair-use > div > p:nth-child(2) > strong:nth-child(2)` | Item | `ba (03) hồ sơ miễn phí` | — | default |
| `policy.sec_2.item_2.text_suffix` | `section#dieu-2-fair-use > div > p:nth-child(2)` | Description | ` trong toàn bộ vòng đời của tài khoản.` | — | default |
| `policy.sec_2.item_3.label` | `section#dieu-2-fair-use > div > p:nth-child(3) > strong` | Label | `2.3. Vượt hạn mức:` | — | default |
| `policy.sec_2.item_3.text` | `section#dieu-2-fair-use > div > p:nth-child(3)` | Description | `Khi sử dụng hết hạn mức, tính năng tạo hồ sơ miễn phí sẽ tự động bị khóa. Sinh viên cần nâng cấp lên các gói phân tích chuyên sâu (Paid Packages) để tiếp tục sử dụng sức mạnh tính toán của mô hình ngôn ngữ lớn (LLM).` | — | default |

---

### 6. Điều 3: Phòng chống lạm dụng & Spam API (Anti-Abuse Restrictions)
*Source: `apps/web-1/app/fair-use-policy/page.tsx:61-73`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.sec_3.title` | `section#dieu-3-chong-lam-dung > Title` (h2) | Heading | `3. Phòng chống lạm dụng & Spam API (Anti-Abuse Restrictions)` | — | default |
| `policy.sec_3.lead` | `section#dieu-3-chong-lam-dung > p` | Description | `Hạ tầng phân tích của chúng tôi phải trả phí trên mỗi truy vấn API (Token) cho OpenAI và Google. Do đó, các hành vi sau bị cấm tuyệt đối:` | — | default |
| `policy.sec_3.item_1.label` | `section#dieu-3-chong-lam-dung > div > p:nth-child(1) > strong` | Label | `Tấn công Sybil:` | — | default |
| `policy.sec_3.item_1.text` | `section#dieu-3-chong-lam-dung > div > p:nth-child(1)` | Description | `Cố tình tạo hàng loạt tài khoản email giả, tài khoản ảo (clone) nhằm vượt qua giới hạn 3 lần miễn phí.` | — | default |
| `policy.sec_3.item_2.label` | `section#dieu-3-chong-lam-dung > div > p:nth-child(2) > strong` | Label | `Tấn công tự động (Automation Abuse):` | — | default |
| `policy.sec_3.item_2.text` | `section#dieu-3-chong-lam-dung > div > p:nth-child(2)` | Description | `Sử dụng phần mềm cào dữ liệu (scrapers), bot, hoặc kịch bản tự động để liên tục gửi các biểu mẫu, hồ sơ rác làm tắc nghẽn hàng đợi của hệ thống.` | — | default |
| `policy.sec_3.item_3.label` | `section#dieu-3-chong-lam-dung > div > p:nth-child(3) > strong` | Label | `Prompt Injection:` | — | default |
| `policy.sec_3.item_3.text` | `section#dieu-3-chong-lam-dung > div > p:nth-child(3)` | Description | `Cố ý nhập các đoạn mã, câu lệnh thao túng nhằm điều hướng AI của Nexus tạo ra các nội dung độc hại, lách luật hoặc truy xuất thông tin hệ thống.` | — | default |

---

### 7. Điều 4: Chuẩn hóa lý do Đóng / Từ chối Hồ sơ (Case Closure Taxonomy)
*Source: `apps/web-1/app/fair-use-policy/page.tsx:76-90`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.sec_4.title` | `section#dieu-4-dong-ho-so > Title` (h2) | Heading | `4. Chuẩn hóa lý do Đóng / Từ chối Hồ sơ (Case Closure Taxonomy)` | — | default |
| `policy.sec_4.lead` | `section#dieu-4-dong-ho-so > p` | Description | `Để bảo vệ chất lượng dịch vụ, Quản trị viên (Admin) và Cố vấn (Supporter) có quyền từ chối tiếp nhận hoặc đóng hồ sơ của bạn với một trong các mã lý do minh bạch sau:` | — | default |
| `policy.sec_4.item_1.label` | `section#dieu-4-dong-ho-so > div > p:nth-child(1) > strong` | Label | `INACTIVE_TIMEOUT (Đóng do bỏ cuộc):` | — | default |
| `policy.sec_4.item_1.text` | `section#dieu-4-dong-ho-so > div > p:nth-child(1)` | Description | `Bạn không phản hồi hoặc không nộp bổ sung tài liệu theo yêu cầu của Supporter sau 14 ngày liên tục.` | — | default |
| `policy.sec_4.item_2.label` | `section#dieu-4-dong-ho-so > div > p:nth-child(2) > strong` | Label | `DUPLICATE_CASE (Hồ sơ trùng lặp):` | — | default |
| `policy.sec_4.item_2.text` | `section#dieu-4-dong-ho-so > div > p:nth-child(2)` | Description | `Gửi nhiều hồ sơ cho cùng một nội dung dự án. Hồ sơ phụ sẽ bị đóng và hoàn tiền.` | — | default |
| `policy.sec_4.item_3.label` | `section#dieu-4-dong-ho-so > div > p:nth-child(3) > strong` | Label | `INSUFFICIENT_DATA (Dữ liệu sơ sài):` | — | default |
| `policy.sec_4.item_3.text` | `section#dieu-4-dong-ho-so > div > p:nth-child(3)` | Description | `Hồ sơ trống rỗng, không chứa dữ kiện cốt lõi về dự án và không được cải thiện dù đã nhắc nhở 2 lần.` | — | default |
| `policy.sec_4.item_4.label` | `section#dieu-4-dong-ho-so > div > p:nth-child(4) > strong` | Label | `OUT_OF_SCOPE (Ngoài phạm vi cố vấn):` | — | default |
| `policy.sec_4.item_4.text` | `section#dieu-4-dong-ho-so > div > p:nth-child(4)` | Description | `Đề tài vi phạm pháp luật, thuần túy là yêu cầu "giải bài tập hộ", hoặc nằm ngoài chuyên môn khởi nghiệp của đội ngũ.` | — | default |
| `policy.sec_4.item_5.label` | `section#dieu-4-dong-ho-so > div > p:nth-child(5) > strong` | Label | `VIOLATION_POLICY (Vi phạm nghiêm trọng):` | — | default |
| `policy.sec_4.item_5.text` | `section#dieu-4-dong-ho-so > div > p:nth-child(5)` | Description | `Gian lận đạo văn, xúc phạm Supporter. Hành vi này dẫn đến đóng hồ sơ KHÔNG hoàn tiền.` | — | default |

---

### 8. Điều 5: Cam kết Chất lượng & Phân luồng Ưu tiên (SLA & Auto-Priority)
*Source: `apps/web-1/app/fair-use-policy/page.tsx:93-109`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.sec_5.title` | `section#dieu-5-cam-ket-sla > Title` (h2) | Heading | `5. Cam kết Chất lượng & Phân luồng Ưu tiên (SLA & Auto-Priority)` | — | default |
| `policy.sec_5.item_1.label` | `section#dieu-5-cam-ket-sla > div > p:nth-child(1) > strong` | Label | `5.1. Cam kết Thời gian (SLA):` | — | default |
| `policy.sec_5.item_1.text` | `section#dieu-5-cam-ket-sla > div > p:nth-child(1)` | Description | `Nexus cam kết thời gian phản hồi tiêu chuẩn là từ 24 - 48 giờ làm việc kể từ lúc Supporter chính thức nhận hồ sơ. Nếu vi phạm SLA (trễ quá 48 giờ) mà không có thông báo chính đáng, bạn sẽ được tự động hoàn tiền 100%.` | — | default |
| `policy.sec_5.item_2.label` | `section#dieu-5-cam-ket-sla > div > p:nth-child(2) > strong` | Label | `5.2. Thuật toán Hàng đợi Thông minh:` | — | default |
| `policy.sec_5.item_2.lead` | `section#dieu-5-cam-ket-sla > div > p:nth-child(2)` | Description | `Hồ sơ của bạn không chỉ được xếp hàng theo thứ tự thời gian. Nền tảng áp dụng thuật toán chấm điểm ưu tiên (Priority Score) theo thời gian thực dựa trên 4 yếu tố:` | — | default |
| `policy.sec_5.item_2.factor_1` | `section#dieu-5-cam-ket-sla > div > p:nth-child(2)` (Dòng 1) | Item | `- Cấp độ gói dịch vụ (Gói trả phí cao được ưu tiên).` | — | default |
| `policy.sec_5.item_2.factor_2` | `section#dieu-5-cam-ket-sla > div > p:nth-child(2)` (Dòng 2) | Item | `- Thời gian chờ đợi của bạn.` | — | default |
| `policy.sec_5.item_2.factor_3` | `section#dieu-5-cam-ket-sla > div > p:nth-child(2)` (Dòng 3) | Item | `- Mức độ khẩn cấp (Hạn nộp bài trên trường của sinh viên).` | — | default |
| `policy.sec_5.item_2.factor_4` | `section#dieu-5-cam-ket-sla > div > p:nth-child(2)` (Dòng 4) | Item | `- Vòng sửa đổi (Các hồ sơ nộp lại bản sửa lỗi được cộng điểm ưu tiên cao để chốt nhanh kết quả).` | — | default |

---

### 9. Điều 6: Chế tài Xử lý Vi phạm
*Source: `apps/web-1/app/fair-use-policy/page.tsx:112-124`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `policy.sec_6.title` | `section#dieu-6-che-tai > Title` (h2) | Heading | `6. Chế tài Xử lý Vi phạm` | — | default |
| `policy.sec_6.lead` | `section#dieu-6-che-tai > p` | Description | `Việc vi phạm bất kỳ điều khoản nào trong Chính sách Vận hành & Sử dụng Công bằng này sẽ dẫn đến các biện pháp xử lý kỷ luật linh hoạt hoặc lập tức:` | — | default |
| `policy.sec_6.item_1.label` | `section#dieu-6-che-tai > div > p:nth-child(1) > strong` | Label | `Cấp độ 1:` | — | default |
| `policy.sec_6.item_1.text` | `section#dieu-6-che-tai > div > p:nth-child(1)` | Description | `Gửi email cảnh cáo chính thức và yêu cầu dừng hành vi vi phạm.` | — | default |
| `policy.sec_6.item_2.label` | `section#dieu-6-che-tai > div > p:nth-child(2) > strong` | Label | `Cấp độ 2:` | — | default |
| `policy.sec_6.item_2.text` | `section#dieu-6-che-tai > div > p:nth-child(2)` | Description | `Hủy bỏ ngay lập tức các hồ sơ đang xử lý (không hoàn tiền) và tạm khóa tính năng nộp bài (Shadow-ban) từ 7 đến 30 ngày.` | — | default |
| `policy.sec_6.item_3.label` | `section#dieu-6-che-tai > div > p:nth-child(3) > strong` | Label | `Cấp độ 3:` | — | default |
| `policy.sec_6.item_3.text` | `section#dieu-6-che-tai > div > p:nth-child(3)` | Description | `Khóa tài khoản vĩnh viễn, đưa địa chỉ IP/Fingerprint vào danh sách đen (Blacklist) ở cấp độ mạng (WAF) và chặn mọi nỗ lực thanh toán trong tương lai.` | — | default |

---

### 10. Footer
*Source: `apps/web-1/components/layout/AppShell.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `footer.logo.alt` | `Logo` > `img[alt]` | Alt text | `Nexus Logo` | `/` | default |
| `footer.link.privacy` | `Anchor` | Navigation | `Chính sách bảo mật` | `/privacy` | default |
| `footer.link.terms` | `Anchor` | Navigation | `Điều khoản sử dụng` | `/terms` | default |
| `footer.link.refund` | `Anchor` | Navigation | `Thanh toán & Hoàn tiền` | `/refund-policy` | default |
| `footer.link.fair_use` | `Anchor` | Navigation | `Quy chế & Fair-Use` | `/fair-use-policy` | default |
| `footer.social.fb_label` | `ActionIcon[aria-label]` | Aria-label | `Nexus Facebook Page` | `https://www.facebook.com/profile.php?id=61591506814865` | default |
| `footer.copyright` | `Text` | Description | `&copy; {new Date().getFullYear()} Nexus Platform. Tất cả quyền được bảo lưu.` | — | default |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Tên văn bản chính sách:**
  - Tiêu đề trang & metadata: `Chính sách Vận hành & Sử dụng Công bằng` (nguồn: `page.tsx:8,25`).
  - Liên kết ở Footer của AppShell: `Quy chế & Fair-Use` (nguồn: `AppShell.tsx:54`).
  - Tên tiếng Anh trong nội dung Điều 1: `Chính sách Vận hành & Sử dụng Công bằng (Acceptable & Fair Use Policy)` (nguồn: `page.tsx:38`).
- **Tên gói miễn phí:**
  - Điều 2: `Gói Miễn phí` / `Gói Free` / `Gói Đánh giá mức độ phù hợp Nhóm - Ý tưởng (Team-Idea Fit)` (nguồn: `page.tsx:45,49`).
  - So sánh với Landing page: Landing page gọi nút CTA là `Kiểm tra miễn phí` dẫn về `/dashboard/team-fit` (nguồn: `LandingHero.tsx:55`).
- **Gói trả phí:**
  - Điều 2.3 gọi chung là: `các gói phân tích chuyên sâu (Paid Packages)` (nguồn: `page.tsx:55`).
- **Vai trò người vận hành / cố vấn:**
  - `Đội ngũ Cố vấn chuyên môn (Human Supporters)` (nguồn: `page.tsx:38`).
  - `Quản trị viên (Admin)` (nguồn: `page.tsx:81`).
  - `Cố vấn (Supporter)` / `Supporter` (nguồn: `page.tsx:81,84,88,99`).
- **Đơn vị nội dung được xử lý:**
  - `hồ sơ` / `hồ sơ miễn phí` / `hồ sơ rác` / `Case`.
- **Hệ thống AI:**
  - `Trí tuệ Nhân tạo (AI Engine)` (nguồn: `page.tsx:38`).
  - `mô hình ngôn ngữ lớn (LLM)` (nguồn: `page.tsx:56`).
  - `OpenAI và Google` (nguồn: `page.tsx:66`).
- **Bảng mã phân loại lý do đóng hồ sơ (Case Closure Taxonomy):**
  - Gồm 5 mã chuẩn hóa: `INACTIVE_TIMEOUT`, `DUPLICATE_CASE`, `INSUFFICIENT_DATA`, `OUT_OF_SCOPE`, `VIOLATION_POLICY` (nguồn: `page.tsx:84-88`).
- **Thuật ngữ kỹ thuật / bảo mật:**
  - `Sybil attack` (`Tấn công Sybil`), `Automation Abuse` (`Tấn công tự động`), `Prompt Injection`, `Shadow-ban`, `Blacklist`, `WAF`, `Fingerprint`, `Priority Score`, `SLA`.

### Hiện trạng kỹ thuật quan sát được
- **Kiến trúc component:** Trang `/fair-use-policy` là một Server Component tĩnh trong Next.js App Router (`page.tsx`), bọc bởi layout `PolicyDocumentLayout` (Client Component) và `AppShell` (Client Component).
- **Tính năng Sidebar Table of Contents:**
  - Component `PolicyDocumentLayout` tự động lắng nghe sự kiện cuộn trang (`window.addEventListener("scroll", ...)`) để cập nhật state `activeSection` tương ứng với vị trí `scrollPosition = window.scrollY + 120`.
  - Khi nhấp vào một mục trong TOC, hàm `scrollToSection` tính toán khoảng cách trừ đi offset `80px` và thực hiện `window.scrollTo({ top: offsetPosition, behavior: "smooth" })`.
- **Hộp liên hệ hỗ trợ điều khoản:** Nằm cố định ở cuối sidebar mục lục, hiển thị liên kết mailto trực tiếp: `mailto:phungluuhoanglong@gmail.com`.
- **Thanh Header & Footer chung:** Tích hợp từ `AppShell.tsx`, hỗ trợ Drawer hiển thị trên mobile khi màn hình nhỏ hơn breakpoint `md`.

### Điểm chưa xác minh (Unknowns / Questions)
- **Cơ chế giới hạn 3 hồ sơ miễn phí:** Logic đếm và chặn "tối đa ba (03) hồ sơ miễn phí trong toàn bộ vòng đời của tài khoản" được kiểm soát tại API/Database nào (dựa vào `user_id`, hay có kiểm tra IP/fingerprint để chống việc tạo clone như nêu tại Điều 3)?
- **Trạng thái triển khai của Case Closure Taxonomy:** 5 mã lý do (`INACTIVE_TIMEOUT`, `DUPLICATE_CASE`, `INSUFFICIENT_DATA`, `OUT_OF_SCOPE`, `VIOLATION_POLICY`) đã được khai báo thành enum trong Prisma schema / API backend để Supporter/Admin lựa chọn trên giao diện workspace chưa, hay hiện tại vẫn là ghi chú thủ công?
- **Thuật toán Priority Score & Tự động hoàn tiền SLA:** Thuật toán chấm điểm ưu tiên hàng đợi (dựa trên 4 yếu tố) và cơ chế tự động hoàn tiền 100% khi Supporter trễ quá 48 giờ đã được viết thành cron job / message queue tự động chưa, hay hiện tại đang xử lý bán tự động?
- **Chế tài cấp độ 2 và 3:** Các cơ chế kỹ thuật như `Shadow-ban` (tạm khóa nộp bài 7-30 ngày) và `Blacklist ở cấp độ WAF` (chặn IP/fingerprint) đã có API/công cụ quản trị trong `/admin` chưa?
