# Phase 02: Routing & Lib Updates

## Target
- `apps/web-1/lib/pricing.ts`
- `apps/web-1/app/auth/get-auth-redirect.ts`

## Change
1. `pricing.ts`: 
   - Thêm định nghĩa hằng số cho 2 gói mới: `AI_AUDIT: "pkg_ai_audit"` và `SUPPORTER_AUDIT: "pkg_supporter_audit"`.
   - Có thể xóa hoặc giữ lại `AUDIT: "pkg_tf_audit"` (nên đổi tên thành `LEGACY_AUDIT` để tránh nhầm lẫn).
2. `get-auth-redirect.ts`:
   - Hàm này chịu trách nhiệm chuyển hướng sau khi đăng nhập xong. 
   - Hiện tại nó đang kiểm tra: `if (packageId === "pkg_tf_audit") return '/dashboard/intake?packageId=...'`.
   - Cần sửa thành logic linh hoạt: Nếu `packageId` có giá trị và không phải là `pkg_tf_free`, thì cho phép chuyển hướng tới `/dashboard/intake?packageId=${packageId}`. Đảm bảo nó hỗ trợ cả 2 gói mới.

## Acceptance
- Khi chưa đăng nhập, user bấm nút ở trang Landing, trình duyệt chuyển sang trang Auth kèm URL `?packageId=pkg_ai_audit`. 
- Đăng nhập/Đăng ký xong, trình duyệt tự động chuyển hướng chuẩn xác về `/dashboard/intake?packageId=pkg_ai_audit` thay vì rơi về `/dashboard` trống không.