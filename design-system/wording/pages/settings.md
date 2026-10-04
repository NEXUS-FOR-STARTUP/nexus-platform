# Page: Settings Index (Redirect)
Route: `/dashboard/settings`  
Access: `Authenticated (server redirect)`

---

## Page Context

### User
- **Primary user:** Người dùng truy cập route gốc `/dashboard/settings`.
- **Typical state:** Chuyển hướng tự động tức thì tới trang cài đặt hồ sơ đầu tiên.
- **Knowledge level:** Không nhận thấy trang này vì server redirect diễn ra ngay lập tức.

### User goals
- Truy cập khu vực cài đặt tài khoản.

### Business/Product goals
- Mặc định mở tab đầu tiên của Settings là thông tin hồ sơ cá nhân (`/dashboard/settings/profile`).

### Primary action
- Không có tương tác UI trực tiếp (server-side redirect).

### Secondary actions
- Không có.

### Entry
- Click mục "Cài đặt" từ menu người dùng hoặc truy cập URL trực tiếp.

### Exit / next step
- Tự động chuyển hướng tới `/dashboard/settings/profile` (nguồn: `apps/web-1/app/dashboard/settings/page.tsx:4`).

### Product facts / constraints
- File `apps/web-1/app/dashboard/settings/page.tsx` chỉ chứa lệnh `redirect("/dashboard/settings/profile")`.
- Không render bất kỳ component giao diện, thẻ HTML hay văn bản nào ra màn hình.

---

## Interactive Inventory

*Source: `apps/web-1/app/dashboard/settings/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.index.redirect` | `SettingsIndexPage` | Navigation | *(Không render UI - Server redirect)* | `/dashboard/settings/profile` | server redirect (`redirect()`) |

---

## Notes

- **Hành vi code xác minh:** `SettingsIndexPage` gọi `redirect("/dashboard/settings/profile")` tại server render time.
- Toàn bộ giao diện các tab cài đặt được phân bổ độc lập tại:
  - `settings-profile.md` (`/dashboard/settings/profile`)
  - `settings-password.md` (`/dashboard/settings/password`)
  - `settings-sessions.md` (`/dashboard/settings/sessions`)
  - `settings-notifications.md` (`/dashboard/settings/notifications`)
