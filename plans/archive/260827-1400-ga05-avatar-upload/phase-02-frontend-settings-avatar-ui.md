# Phase 2: Frontend Settings Avatar UI & Session Sync

## Objective

Tích hợp giao diện người dùng cho tính năng đổi ảnh đại diện trong trang Cài đặt (`/dashboard/settings/profile` và `/supporter/settings/profile`), đồng bộ hóa trạng thái phiên đăng nhập của Better Auth để cập nhật ảnh đại diện tức thì trên toàn bộ giao diện (Settings form & Navbar UserMenu) mà không cần reload trang.

---

## Chi tiết Kiến trúc & Luồng Thực thi

### 1. Mutation Hook (`apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`)
- **Validation Client-side (`validateAvatarFile`)**:
  - Kiểm tra extension `.jpg`, `.jpeg`, `.png`, `.webp` và dung lượng $\le 2\text{ MB}$ trước khi gửi request để tăng trải nghiệm người dùng.
- **Xử lý Request**:
  - Tạo `FormData` append `file`.
  - Gửi `POST /profile/avatar` bằng `apiClient.post` với header `Content-Type: multipart/form-data`.
- **Đồng bộ State & Cache trong `onSuccess`**:
  - Gọi `authClient.getSession()` để nạp lại phiên mới nhất từ server.
  - Invalidate cache TanStack Query:
    `queryClient.invalidateQueries({ queryKey: ["session"] });`
    `queryClient.invalidateQueries({ queryKey: ["user"] });`
    `queryClient.invalidateQueries({ queryKey: ["profile"] });`
  - Hiển thị Toast thông báo thành công tiếng Việt:
    `notifications.show({ title: "Thành công", message: "Đã cập nhật ảnh đại diện.", color: "green" });`
- **Xử lý Lỗi trong `onError`**:
  - Trích xuất thông báo lỗi từ server qua `extractApiErrorMessage(err)` và hiển thị Toast màu đỏ.

### 2. Form Hồ sơ Cá nhân (`apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`)
- **Hiển thị Avatar**:
  - Mantine `Avatar` kích thước 96px (`size={96} radius="100%"`), `src={user.image ?? undefined}`.
  - Fallback hiển thị 2 ký tự đầu viết hoa của tên người dùng (`(user.name || "U").substring(0, 2).toUpperCase()`).
- **Nút "Đổi ảnh" & File Input ẩn**:
  - Thẻ `<input type="file" ref={fileInputRef} accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden onChange={handleAvatarFile} />`.
  - Nút bấm `Button variant="default" leftSection={<ImagePlus />} onClick={handleChangeAvatar}`.
  - **Chống Race Condition**: Bật `loading={changeAvatar.isPending}` và `disabled={changeAvatar.isPending}` khi đang tải ảnh.
  - **Reset input value**: `event.target.value = ""` sau khi đọc file để hỗ trợ chọn lại cùng một file nếu cần.
- **Callback `onSuccess`**:
  - Gọi `void refetch()` từ Better Auth `useSession()` truyền từ Page cha để cập nhật props `user`.

### 3. Đồng bộ Navbar Menu (`apps/web-1/components/layout/_components/UserMenu.tsx`)
- Lắng nghe session từ `useSession()`.
- Khi `authClient.getSession()` hoặc `refetch()` được gọi từ form cài đặt, `UserMenu` tự động re-render và hiển thị ảnh đại diện mới trên thanh header.

---

## Tiêu chuẩn Nghiệm thu (Acceptance Criteria)

1. [x] Người dùng nhấn nút "Đổi ảnh" tại `/dashboard/settings/profile` hoặc `/supporter/settings/profile` mở file picker chọn ảnh trên máy.
2. [x] Chọn ảnh hợp lệ (.jpg, .jpeg, .png, .webp, <= 2MB) hiển thị spinner loading trên nút "Đổi ảnh" và vô hiệu hóa nút bấm trong quá trình tải.
3. [x] Sau khi upload thành công, xuất hiện thông báo toast xanh "Đã cập nhật ảnh đại diện."
4. [x] Ảnh đại diện mới hiển thị ngay lập tức trên form cài đặt và trên icon Avatar của Navbar Header mà không cần reload lại cả trang (F5).
5. [x] Nếu chọn file sai định dạng hoặc vượt quá 2MB, hiển thị thông báo lỗi rõ ràng và không làm thay đổi ảnh đại diện hiện tại.
