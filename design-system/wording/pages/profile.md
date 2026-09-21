# Page: Legacy Profile (Redirect)
Route: `/dashboard/profile`  
Access: `Authenticated (server redirect)`

---

## Page Context

### User
- **Primary user:** Người dùng truy cập vào route cũ `/dashboard/profile`.
- **Typical state:** Chuyển hướng tự động sang trang cài đặt hồ sơ mới.
- **Knowledge level:** Không nhận thấy trang này vì server redirect diễn ra ngay lập tức.

### User goals
- Xem hoặc chỉnh sửa thông tin cá nhân.

### Business/Product goals
- Duy trì tương thích ngược (Backward compatibility) cho các liên kết cũ trỏ về `/dashboard/profile`.

### Primary action
- Không có tương tác UI trực tiếp (server-side redirect).

### Secondary actions
- Không có.

### Entry
- Bookmark cũ hoặc URL truy cập trực tiếp từ trình duyệt.

### Exit / next step
- Tự động chuyển hướng tới `/dashboard/settings/profile` (nguồn: `apps/web-1/app/dashboard/profile/page.tsx:4`).

### Product facts / constraints
- File `apps/web-1/app/dashboard/profile/page.tsx` chỉ chứa hàm `redirect("/dashboard/settings/profile")` từ `next/navigation`.
- Không render bất kỳ component giao diện, thẻ HTML hay chuỗi văn bản nào ra màn hình.

---

## Interactive Inventory

*Source: `apps/web-1/app/dashboard/profile/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `legacy.profile.redirect` | `LegacyProfilePage` | Navigation | *(Không render UI - Server redirect)* | `/dashboard/settings/profile` | server redirect (`redirect()`) |

---

## Notes

- **Hành vi code xác minh:** `LegacyProfilePage` gọi `redirect("/dashboard/settings/profile")` tại server render time.
- Toàn bộ nội dung giao diện hồ sơ người dùng thực tế được định nghĩa và quản lý tại `settings-profile.md` (route `/dashboard/settings/profile`).
