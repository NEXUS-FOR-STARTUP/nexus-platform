# Quy chuẩn Quản lý & Trích xuất Wording (UX Copy System)

> **Phạm vi áp dụng:** Thư mục `design-system/wording/`  
> **Mục tiêu:** Cung cấp hệ thống dữ liệu nguồn khách quan (Factual UI Inventory & Context) phục vụ quá trình audit, chuẩn hóa thuật ngữ và tối ưu hóa UX Copy trên toàn hệ thống Nexus Platform.

---

## 1. Cấu trúc thư mục

```
design-system/wording/
├── AGENTS.md                 # Tài liệu này - Tiêu chuẩn và quy trình trích xuất
├── ux-context.md             # Bối cảnh sản phẩm, luồng hành trình & hiện trạng thuật ngữ
├── pages/                    # Mỗi route/page là một file markdown độc lập (1-to-1)
│   ├── landing-page.md       # Trang chủ (/)
│   ├── auth.md               # Đăng nhập, Đăng ký (/auth)
│   ├── verify-email.md       # Xác thực email (/auth/verify-email)
│   ├── dashboard-home.md     # Màn hình chính Dashboard sinh viên (/dashboard)
│   ├── team-fit.md           # Đánh giá độ tương thích đội ngũ (/dashboard/team-fit)
│   ├── intake-form.md        # Form nộp hồ sơ (/dashboard/intake)
│   ├── case-detail.md        # Chi tiết hồ sơ & Báo cáo phản biện (/dashboard/case/[id])
│   ├── case-payment.md       # Thanh toán theo hồ sơ (/dashboard/case/[id]/payment)
│   ├── payment.md            # Thanh toán (/dashboard/payment)
│   ├── payments.md           # Redirect alias (/dashboard/payments -> /dashboard/wallet)
│   ├── wallet.md             # Ví & Lịch sử giao dịch (/dashboard/wallet)
│   ├── profile.md            # Redirect alias (/dashboard/profile -> /dashboard/settings/profile)
│   ├── settings.md           # Cài đặt tổng quan (/dashboard/settings)
│   ├── settings-profile.md   # Cài đặt thông tin cá nhân (/dashboard/settings/profile)
│   ├── settings-password.md  # Cài đặt đổi mật khẩu (/dashboard/settings/password)
│   ├── settings-sessions.md  # Quản lý phiên đăng nhập (/dashboard/settings/sessions)
│   ├── settings-notifications.md # Cài đặt thông báo (/dashboard/settings/notifications)
│   ├── supporter.md          # Không gian làm việc Supporter (/supporter)
│   ├── supporter-case-detail.md # Chi tiết hồ sơ phía Supporter (/supporter/case/[id])
│   ├── supporter-profile.md  # Hồ sơ Supporter (/supporter/settings/profile)
│   ├── supporter-password.md # Đổi mật khẩu Supporter (/supporter/settings/password)
│   ├── supporter-sessions.md # Phiên đăng nhập Supporter (/supporter/settings/sessions)
│   ├── admin.md              # Bảng điều khiển quản trị viên & Worker (/admin)
│   ├── terms.md              # Điều khoản dịch vụ (/terms)
│   ├── privacy.md            # Chính sách bảo mật (/privacy)
│   ├── refund-policy.md      # Chính sách thanh toán & hoàn tiền (/refund-policy)
│   ├── fair-use-policy.md    # Quy chế & Fair-Use (/fair-use-policy)
│   └── maintenance.md        # Thông báo bảo trì (/maintenance)
└── screenshots/              # Ảnh chụp màn hình đối chiếu thị giác (desktop/mobile)
```

---

## 2. Tiêu chuẩn cấu trúc 3 lớp cho mỗi Page (`pages/*.md`)

Mọi file trích xuất trong thư mục `pages/` **BẮT BUỘC** phải tuân thủ đúng 3 lớp thông tin sau:

### Lớp 1: Page Context (Ngữ cảnh trang & Luồng hành vi)
Cung cấp bối cảnh thực tế của người dùng khi đứng ở màn hình này:
- **Header:** `# Page: [Tên trang]`, `Route: [Đường dẫn]`, `Access: [Public | Authenticated | Supporter | Admin]`
- **User:**
  - *Primary user:* Đối tượng chính của trang (căn cứ theo tài liệu sản phẩm hoặc route).
  - *Typical state:* Trạng thái công việc/tâm lý thường thấy (nếu là giả định, ghi rõ `[Assumption / Cần xác minh]`).
  - *Knowledge level:* Mức độ hiểu biết về sản phẩm tại thời điểm này.
- **User goals:** Người dùng muốn biết/làm gì trên màn hình này.
- **Business/Product goals:** Mục tiêu chuyển đổi hoặc định vị sản phẩm tại trang này.
- **Primary action:** Hành động chính hệ thống hướng người dùng tới.
- **Secondary actions:** Các hành động phụ.
- **Entry:** Người dùng có thể đến trang này từ các nguồn nào (`[Assumption / Cần xác minh]` nếu chưa có số liệu tracking).
- **Exit / next step:** Đường dẫn tiếp theo khi người dùng hoàn thành hành động trên trang.
- **Product facts / constraints:** Các sự thật kỹ thuật đã xác minh từ mã nguồn (trạng thái gói, tính năng đã/chưa hoạt động, điều kiện tài liệu).

### Lớp 2: Interactive Inventory (Bảng kiểm kê tương tác 6 cột)
Bảng kiểm kê toàn bộ câu chữ hiển thị trên màn hình được chia theo từng Section trực quan:

```markdown
| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| hero.title | Hero > h1 | Heading | ... | — | default |
| hero.primaryCTA | Hero > Button | CTA | Kiểm tra miễn phí | /dashboard/team-fit | public link (no auth guard in component) |
| contact.form.email | Form > TextInput | Placeholder | email@example.com | — | default |
| contact.submit.toast | notifications.show | Toast | Chức năng đang phát triển | — | client toast trigger |
```

#### Quy chuẩn các cột:
1. **`ID`**: Key định danh dạng dot-notation (ví dụ: `hero.title`, `pricing.basic.cta`).
2. **`Component / Vị trí`**: Tên component Mantine/React/HTML và vị trí phân cấp trực quan.
3. **`Type`**: Phân loại chức năng UX của câu chữ:
   - `Heading`, `Description`, `CTA`, `Navigation`, `Label`, `Placeholder`, `Helper`
   - `Error`, `Empty state`, `Toast`, `Badge`, `Item`, `Modal`, `Alt text`, `Aria-label`
4. **`Current wording`**: Nguyên văn chuỗi chữ đang hiển thị trong code.
5. **`Action / Destination`**: Kết quả tương tác khi click/chạm (URL chuyển hướng, modal mở ra, toast kích hoạt, form submit...).
6. **`State`**: Trạng thái hiển thị khách quan (`default`, `disabled`, `loading`, `error`, `public link`, `authenticated only`...).

> ⛔ **NGUYÊN TẮC FACTUAL:** Không tự ý thêm các cột nhận xét chủ quan, cột đề xuất viết lại (`Suggested wording`), hay cột phán xét lỗi (`Problem / Severity`) vào bảng Inventory ở bước trích xuất. Bảng này phải phản ánh **thực tế khách quan 100% của UI và tương tác**.

### Lớp 3: Page Notes (Ghi chú ngữ cảnh, biến thể thuật ngữ & điểm chưa rõ)
Ghi nhận các sự thật ngữ cảnh bổ trợ giúp quá trình audit sau này không bị hiểu sai mental model:
- **Biến thể thuật ngữ xuất hiện trên trang:** Liệt kê các cách gọi khác nhau cho cùng một khái niệm (ví dụ: `Supporter` vs `Mentor` vs `chuyên gia`).
- **Hiện trạng kỹ thuật quan sát được:** Ví dụ nút bấm có handler gì, dẫn đi đâu, form có gọi API backend hay chỉ bật toast client-side.
- **Điểm chưa xác minh (Unknowns / Questions):** Những câu hỏi về product logic cần Product Owner/Team làm rõ trước khi audit.

---

## 3. Quy trình trích xuất chuẩn cho Agent (Extraction SOP)

1. **Khảo sát mã nguồn qua CodeGraph:** 
   - **BẮT BUỘC:** Sử dụng `codegraph_explore` MCP (hoặc `codegraph explore` CLI) trước khi đọc file hoặc grep để nắm cấu trúc symbol, component tree và call-graph của trang.
   - Đọc component cha (`page.tsx`), layout wrapper (`AppShell.tsx` hoặc `DashboardShell.tsx`) và toàn bộ subcomponents liên quan.
   - Kiểm tra các file schema/validation để lấy trọn vẹn error message và placeholder.
   - Kiểm tra các hàm `notifications.show`, modal dialogs hoặc conditional renders.
2. **Lập Page Context (Lớp 1):** Xác định đúng user state, user goal, entry/exit và các product facts đã kiểm chứng từ code. Ghi nhãn `[Assumption / Cần xác minh]` cho các giả định chưa có source.
3. **Trích xuất Inventory (Lớp 2):** 
   - Điền đầy đủ 6 cột cho từng phần tử.
   - Không bỏ sót: `alt text` của ảnh, `aria-label` của icon button, `placeholder`, `helperText`, `validation error`, `toast notification`.
4. **Ghi chú Page Notes (Lớp 3):** Ghi lại hiện trạng thuật ngữ, code behavior và unknowns.
5. **Đặt tên file:** Lưu vào `design-system/wording/pages/[tên-màn-hình].md`.

---

## 4. Quy ước ảnh chụp màn hình (`screenshots/`)

- Khi dev server hoạt động (`http://localhost:3001`), chụp ảnh màn hình bằng browser tự động và lưu vào `screenshots/` theo định dạng:
  - `[page-id]-desktop.png` (viewport 1440x900)
  - `[page-id]-mobile.png` (viewport 375x812 - nếu giao diện mobile có cấu trúc khác biệt đáng kể)
- Ảnh chụp màn hình giúp đối soát độ dài của text, điểm ngắt dòng (line-wrap), sự cạnh tranh thị giác giữa các CTA và nhịp đọc của người dùng.
