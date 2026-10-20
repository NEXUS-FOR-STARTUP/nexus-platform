# Quy chuẩn Quản lý & Trích xuất Wording (UX Copy System)

> **Phạm vi:** Thư mục `design-system/wording/`  
> **Mục tiêu:** Cung cấp dữ liệu nguồn khách quan (Factual UI Inventory & Context) phục vụ audit, chuẩn hóa thuật ngữ, tối ưu UX Copy toàn hệ thống Nexus Platform.

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

Mọi file trong `pages/` **BẮT BUỘC** theo đúng 3 lớp:

### Lớp 1: Page Context (Ngữ cảnh trang & Luồng hành vi)
Bối cảnh thực tế người dùng tại màn hình này:
- **Header:** `# Page: [Tên trang]`, `Route: [Đường dẫn]`, `Access: [Public | Authenticated | Supporter | Admin]`
- **User:**
  - *Primary user:* Đối tượng chính (theo tài liệu sản phẩm hoặc route).
  - *Typical state:* Trạng thái công việc/tâm lý thường thấy (giả định → ghi `[Assumption / Cần xác minh]`).
  - *Knowledge level:* Mức hiểu biết sản phẩm lúc này.
- **User goals:** Người dùng muốn biết/làm gì.
- **Business/Product goals:** Mục tiêu chuyển đổi/định vị sản phẩm tại trang.
- **Primary action:** Hành động chính hệ thống hướng tới.
- **Secondary actions:** Hành động phụ.
- **Entry:** Nguồn đến trang (`[Assumption / Cần xác minh]` nếu chưa có tracking).
- **Exit / next step:** Đường đi tiếp sau khi hoàn thành hành động.
- **Product facts / constraints:** Sự thật kỹ thuật đã xác minh từ code (trạng thái gói, tính năng đã/chưa hoạt động, điều kiện tài liệu).

### Lớp 2: Interactive Inventory (Bảng kiểm kê tương tác 6 cột)
Bảng kiểm kê toàn bộ câu chữ hiển thị, chia theo Section trực quan:

```markdown
| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| hero.title | Hero > h1 | Heading | ... | — | default |
| hero.primaryCTA | Hero > Button | CTA | Kiểm tra miễn phí | /dashboard/team-fit | public link (no auth guard in component) |
| contact.form.email | Form > TextInput | Placeholder | email@example.com | — | default |
| contact.submit.toast | notifications.show | Toast | Chức năng đang phát triển | — | client toast trigger |
```

#### Quy chuẩn các cột:
1. **`ID`**: Key dot-notation (vd: `hero.title`, `pricing.basic.cta`).
2. **`Component / Vị trí`**: Tên component Mantine/React/HTML + vị trí phân cấp trực quan.
3. **`Type`**: Phân loại chức năng UX của câu chữ:
   - `Heading`, `Description`, `CTA`, `Navigation`, `Label`, `Placeholder`, `Helper`
   - `Error`, `Empty state`, `Toast`, `Badge`, `Item`, `Modal`, `Alt text`, `Aria-label`
4. **`Current wording`**: Nguyên văn chuỗi trong code.
5. **`Action / Destination`**: Kết quả khi click/chạm (URL chuyển hướng, modal mở, toast kích hoạt, form submit...).
6. **`State`**: Trạng thái hiển thị khách quan (`default`, `disabled`, `loading`, `error`, `public link`, `authenticated only`...).

> ⛔ **NGUYÊN TẮC FACTUAL:** Không thêm cột nhận xét chủ quan, cột đề xuất viết lại (`Suggested wording`), cột phán xét lỗi (`Problem / Severity`) vào Inventory ở bước trích xuất. Bảng phản ánh **thực tế khách quan 100% của UI + tương tác**.

### Lớp 3: Page Notes (Ghi chú ngữ cảnh, biến thể thuật ngữ & điểm chưa rõ)
Ghi sự thật ngữ cảnh bổ trợ để audit sau không hiểu sai mental model:
- **Biến thể thuật ngữ trên trang:** Liệt kê các cách gọi khác nhau cho cùng khái niệm (vd: `Supporter` vs `Mentor` vs `chuyên gia`).
- **Hiện trạng kỹ thuật quan sát được:** Vd nút có handler gì, dẫn đi đâu, form gọi API backend hay chỉ bật toast client-side.
- **Điểm chưa xác minh (Unknowns / Questions):** Câu hỏi product logic cần Product Owner/Team làm rõ trước audit.

---

## 3. Quy trình trích xuất chuẩn cho Agent (Extraction SOP)

1. **Khảo sát code qua CodeGraph:** 
   - **BẮT BUỘC:** Dùng `codegraph_explore` MCP (hoặc `codegraph explore` CLI) trước khi đọc file/grep để nắm symbol, component tree, call-graph của trang.
   - Đọc component cha (`page.tsx`), layout wrapper (`AppShell.tsx` hoặc `DashboardShell.tsx`) + mọi subcomponent liên quan.
   - Kiểm tra schema/validation để lấy trọn error message + placeholder.
   - Kiểm tra `notifications.show`, modal dialogs, conditional renders.
2. **Lập Page Context (Lớp 1):** Xác định đúng user state, user goal, entry/exit, product facts đã kiểm chứng từ code. Giả định chưa có source ghi `[Assumption / Cần xác minh]`.
3. **Trích xuất Inventory (Lớp 2):** 
   - Điền đủ 6 cột mỗi phần tử.
   - Không bỏ sót: `alt text` ảnh, `aria-label` icon button, `placeholder`, `helperText`, `validation error`, `toast notification`.
4. **Ghi Page Notes (Lớp 3):** Ghi hiện trạng thuật ngữ, code behavior, unknowns.
5. **Đặt tên file:** Lưu `design-system/wording/pages/[tên-màn-hình].md`.

---

## 4. Quy ước ảnh chụp màn hình (`screenshots/`)

- Dev server chạy (`http://localhost:3001`) → chụp bằng browser tự động, lưu `screenshots/` theo định dạng:
  - `[page-id]-desktop.png` (viewport 1440x900)
  - `[page-id]-mobile.png` (viewport 375x812 - nếu mobile có cấu trúc khác đáng kể)
- Ảnh giúp đối soát độ dài text, điểm ngắt dòng (line-wrap), cạnh tranh thị giác giữa CTA, nhịp đọc người dùng.
