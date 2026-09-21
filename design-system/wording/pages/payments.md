# Page: Legacy Payments (Redirect)
Route: `/dashboard/payments`  
Access: `Authenticated (client redirect)`

---

## Page Context

### User
- **Primary user:** Người dùng truy cập vào route cũ `/dashboard/payments`.
- **Typical state:** Chuyển hướng tự động bằng client-side hook sang trang ví & lịch sử giao dịch.
- **Knowledge level:** Không nhận thấy trang này vì `router.replace()` kích hoạt ngay khi mount.

### User goals
- Xem lịch sử thanh toán hoặc nạp tiền ví.

### Business/Product goals
- Chuyển hướng người dùng từ trang lịch sử thanh toán cũ về trang ví trung tâm `/dashboard/wallet`.

### Primary action
- Không có tương tác UI trực tiếp (client-side redirect qua `useEffect`).

### Secondary actions
- Không có.

### Entry
- Bookmark cũ hoặc URL gõ trực tiếp.

### Exit / next step
- Tự động chuyển hướng tới `/dashboard/wallet` (nguồn: `apps/web-1/app/dashboard/payments/page.tsx:10`).

### Product facts / constraints
- File `apps/web-1/app/dashboard/payments/page.tsx` trả về `return null;` và gọi `router.replace("/dashboard/wallet")` trong `useEffect`.
- Không render bất kỳ component giao diện, thẻ HTML hay chuỗi văn bản nào ra màn hình.

---

## Interactive Inventory

*Source: `apps/web-1/app/dashboard/payments/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `legacy.payments.redirect` | `PaymentsPage` | Navigation | *(Không render UI - Client redirect)* | `/dashboard/wallet` | client redirect (`router.replace()`) |

---

## Notes

- **Hành vi code xác minh:** `PaymentsPage` sử dụng `useEffect` gọi `router.replace("/dashboard/wallet")`. Component return `null`.
- Toàn bộ giao diện lịch sử thanh toán và số dư ví thực tế được quản lý tại `wallet.md` (route `/dashboard/wallet`).
