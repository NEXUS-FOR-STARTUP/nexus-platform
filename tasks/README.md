# Task Management — Nexus Platform

Thư mục quản lý nhiệm vụ, tài liệu đặc tả lỗi (bugs) và theo dõi tiến độ phát triển của dự án Nexus Platform.

---

## 🎯 Bảng theo dõi chính (Active Master Tracker)

Nguồn sự thật chính cho toàn bộ các nhiệm vụ phát triển hiện tại:
👉 **[`gap-analysis-tasks.md`](./gap-analysis-tasks.md)** — Master Tracking Table (GA-01 đến GA-22).
👉 **[`gap-analysis-tasks.xlsx`](./gap-analysis-tasks.xlsx)** — Bảng tính quản lý & báo cáo (thao tác qua skill `ck:xlsx`).

### Tóm tắt trạng thái Gap Analysis (GA-01 → GA-22)

| Nhóm | Tổng | Todo | In Progress | Review | Done | Blocked / Dropped |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **P0 (Khẩn cấp/Bảo mật/Pháp lý)** | 4 | 0 | 0 | 0 | **4** | 0 |
| **P1 (Tính năng bắt buộc học kỳ)** | 10 | 1 | 0 | 0 | **8** | **1 (Bỏ)** |
| **P2 (Cải tiến & Nợ kỹ thuật)** | 8 | 5 | 0 | 0 | **2** | **1 (Bỏ)** |
| **TỔNG CỘNG** | **22** | **6** | **0** | **0** | **14** | **2** |

---

## 📁 Danh sách tài liệu chi tiết (`tasks/bugs/`)

Mỗi nhiệm vụ trong Gap Analysis được mô tả chi tiết thành 1 file tài liệu độc lập trong `tasks/bugs/`:

| ID | Task | Priority | Status | Chi tiết file spec |
|---|---|:---:|:---:|---|
| **GA-01** | Quên mật khẩu qua emailOTP | P0 | ✅ **Done** | [`bugs/ga-01-forgot-password-flow.md`](./bugs/ga-01-forgot-password-flow.md) |
| **GA-02** | Fix kẹt flow `intake_ready` | P0 | ✅ **Done** | [`bugs/ga-02-intake-flow-stuck-fix.md`](./bugs/ga-02-intake-flow-stuck-fix.md) |
| **GA-03** | Rate limit + Account Lockout | P0 | ✅ **Done** | [`bugs/ga-03-rate-limit-and-account-lockout.md`](./bugs/ga-03-rate-limit-and-account-lockout.md) |
| **GA-04** | Xóa tài khoản (NĐ 13/2023 72h) | P0 | ✅ **Done** | [`bugs/ga-04-account-deletion-compliance.md`](./bugs/ga-04-account-deletion-compliance.md) |
| **GA-05** | Upload Avatar người dùng | P1 | ✅ **Done** | [`bugs/ga-05-avatar-upload.md`](./bugs/ga-05-avatar-upload.md) |
| **GA-06** | UI quản lý Session/Thiết bị | P1 | ✅ **Done** | [`bugs/ga-06-session-management-ui.md`](./bugs/ga-06-session-management-ui.md) |
| **GA-07** | Session timeout policy | P1 | ✅ **Done** | [`bugs/ga-07-session-timeout-policy.md`](./bugs/ga-07-session-timeout-policy.md) |
| **GA-08** | Notification preferences | P1 | ✅ **Done** | [`bugs/ga-08-notification-preferences.md`](./bugs/ga-08-notification-preferences.md) |
| **GA-09** | Pagination & Search server-side | P1 | ✅ **Done** | [`bugs/ga-09-server-pagination-search.md`](./bugs/ga-09-server-pagination-search.md) |
| **GA-10** | Export CSV/Excel cho Admin | P1 | ✅ **Done** | [`bugs/ga-10-admin-export-csv.md`](./bugs/ga-10-admin-export-csv.md) |
| **GA-11** | User data export (NĐ 13/2023) | P1 | ⚪ **Dropped** | [`bugs/ga-11-user-data-export.md`](./bugs/ga-11-user-data-export.md) |
| **GA-12** | ToS/Privacy Policy + Consent | P1 | ✅ **Done** | [`bugs/ga-12-tos-privacy-policy-consent.md`](./bugs/ga-12-tos-privacy-policy-consent.md) |
| **GA-13** | 2FA cho Admin/Supporter | P1 | ❌ **Todo** | [`bugs/ga-13-two-factor-authentication.md`](./bugs/ga-13-two-factor-authentication.md) |
| **GA-14** | Rút tiền thủ công khỏi ví | P2 | ⚪ **Dropped** | [`bugs/ga-14-wallet-manual-withdrawal.md`](./bugs/ga-14-wallet-manual-withdrawal.md) |
| **GA-15** | Chính sách Credit mở | P2 | 📋 **Policy (Kinh doanh)** | [`bugs/ga-15-credit-lifecycle-policy.md`](./bugs/ga-15-credit-lifecycle-policy.md) |
| **GA-16** | Admin Taxonomy & Auto-priority | P2 | 📋 **Policy (Vận hành)** | [`bugs/ga-16-admin-taxonomy-and-priority.md`](./bugs/ga-16-admin-taxonomy-and-priority.md) |
| **GA-17** | CSRF & Durable Rate Limit | P2 | ⚠️ **Partially** | [`bugs/ga-17-app-csrf-and-rate-limit-infra.md`](./bugs/ga-17-app-csrf-and-rate-limit-infra.md) |
| **GA-18** | Dọn dẹp Deprecated & Dead code | P2 | ⚠️ **Partially** | [`bugs/ga-18-cleanup-deprecated-dead-code.md`](./bugs/ga-18-cleanup-deprecated-dead-code.md) |
| **GA-19** | Chat unread per user | P2 | ✅ **Done** | [`bugs/ga-19-chat-unread-per-user.md`](./bugs/ga-19-chat-unread-per-user.md) |
| **GA-20** | Tự động hóa Backup DB | P2 | ✅ **Done** | [`bugs/ga-20-automated-db-backup.md`](./bugs/ga-20-automated-db-backup.md) |
| **GA-21** | Trả nợ test baseline | P2 | ❌ **Todo** | [`bugs/ga-21-baseline-test-debt.md`](./bugs/ga-21-baseline-test-debt.md) |
| **GA-22** | Auto-create ví khi Signup | P1 | ✅ **Done** | [`bugs/ga-22-wallet-auto-create-on-signup.md`](./bugs/ga-22-wallet-auto-create-on-signup.md) |
---

## 📁 Cấu trúc thư mục

```
tasks/
├── README.md               ← File hướng dẫn & điều hướng tổng quan
├── gap-analysis-tasks.md   ← Master tracking table (GA-01 đến GA-22)
├── gap-analysis-tasks.xlsx ← File Excel quản lý / báo cáo
├── AGENTS.md               ← Quy tắc cho agent khi thao tác với tasks/ và Excel
└── bugs/                   ← 22 file tài liệu đặc tả chi tiết cho từng task (GA-01 đến GA-22)
    ├── ga-01-forgot-password-flow.md
    ├── ga-02-intake-flow-stuck-fix.md
    ├── ...
    └── ga-22-wallet-auto-create-on-signup.md
```
