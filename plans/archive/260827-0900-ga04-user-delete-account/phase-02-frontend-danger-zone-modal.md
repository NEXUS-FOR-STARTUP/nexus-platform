# Phase 2: Frontend Danger Zone & Delete Account Modal

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-backend-soft-delete-api.md](./phase-01-backend-soft-delete-api.md)
- Settings Layout: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx`
- Profile Info Form: `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`
- Profile Mutations Hook: `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`
- Case Settings Delete Modal Reference: `apps/web-1/app/dashboard/case/[id]/_components/TabCaseSettings.tsx`

## Overview
- **Priority:** P2
- **Status:** Completed
- **Description:** Tích hợp tính năng xóa tài khoản vào giao diện người dùng. Theo đúng cấu trúc cài đặt (Settings chia mục theo Sidebar Nav), mục "Xóa tài khoản" sẽ nằm trong tab/trang **"Thông tin cơ bản"** (`/profile`) và được đặt tại **vị trí cuối cùng** dưới dạng một khối **Vùng nguy hiểm (Danger Zone)** với nút bấm màu đỏ. Khi nhấn nút, hiển thị Modal xác nhận yêu cầu người dùng nhập "XOA" để xác thực trước khi thực thi.

## Key Insights
1. **Vị trí và Phân cấp thị giác:**
   - Trang Cài đặt có 2 mục chính trong Sidebar: "Thông tin cơ bản" (`/profile`) và "Đổi mật khẩu" (`/password`).
   - "Xóa tài khoản" là hành động nghiêm trọng nhất của tài khoản người dùng, do đó phải đặt ở cuối cùng của trang "Thông tin cơ bản", tách biệt rõ ràng khỏi các form cập nhật thông tin thường nhật (Tên hiển thị, Avatar) qua đường kẻ phân cách hoặc khối Danger Zone có viền cảnh báo (`border-danger/20` / `bg-danger-soft/20`).
2. **Cơ chế phòng tránh nhấn nhầm (Accidental Prevention):**
   - Không cho phép xóa chỉ bằng 1 click.
   - Bắt buộc mở `DeleteAccountModal` cảnh báo rõ hậu quả: Hủy toàn bộ phiên đăng nhập, không thể khôi phục tài khoản.
   - Nút "Xác nhận xóa tài khoản" chỉ kích hoạt khi người dùng nhập chính xác chuỗi ký tự `"XOA"`.
3. **Dọn dẹp State và Chuyển hướng sau khi xóa:**
   - Gọi mutation `deleteAccount`.
   - Khi xóa thành công:
     1. Gọi `signOut()` của Better Auth để xóa cookies/tokens trên trình duyệt.
     2. Gọi `queryClient.clear()` để xóa toàn bộ cache React Query.
     3. Hiển thị Toast thông báo màu xanh/đỏ: `"Tài khoản của bạn đã được xóa thành công."`.
     4. Điều hướng người dùng về trang đăng nhập `/auth` (hoặc trang chủ `/`).

## Requirements
### Functional Requirements
- **Hook `deleteAccount` trong `useProfileMutations.ts`:**
  - Thực hiện gọi `apiClient.delete("/profile/account")`.
  - Quản lý trạng thái `isPending`, `isSuccess`, `isError`.
- **Component `DeleteAccountModal.tsx`:**
  - Dùng Mantine `Modal` (centered, size="md", radius="md").
  - Title: Icon `Trash2` hoặc `AlertTriangle` màu đỏ + text "Xóa tài khoản vĩnh viễn".
  - Nội dung cảnh báo nguy hiểm bằng tiếng Việt rõ ràng.
  - Trường `TextInput` yêu cầu gõ `"XOA"` để xác nhận.
  - Nút "Hủy" (variant="default") và Nút "Xác nhận xóa" (color="red", disabled nếu confirm text !== "XOA" hoặc đang xử lý).
- **Cập nhật `ProfileInfoForm.tsx`:**
  - Thêm phần "Vùng nguy hiểm" (Danger Zone) ở cuối cùng của form/Paper.
  - Tiêu đề: "Vùng nguy hiểm" với icon `Trash2` hoặc `AlertCircle` màu đỏ.
  - Mô tả: "Sau khi xóa tài khoản, bạn sẽ không thể đăng nhập hoặc khôi phục dữ liệu cá nhân."
  - Nút "Xóa tài khoản" màu đỏ (`color="red"`, `variant="outline"` hoặc `variant="filled"`).

### Non-Functional Requirements
- Tuân thủ Mantine UI v9 và Tailwind CSS theme của Nexus.
- Không dùng manual fixed positioning class lên Mantine Modal (tránh lỗi layout theo `AGENTS.md`).
- Responsive trên cả mobile và desktop.

## UI/UX Wireframe & Placement

```
┌──────────────────────────────────────────────────────────┐
│  Cài đặt                                                 │
│  Quản lý thông tin cá nhân và bảo mật tài khoản          │
├─────────────────┬────────────────────────────────────────┤
│ [Sidebar]       │ [Thông tin cơ bản]                     │
│                 │                                        │
│ • Thông tin     │  [Avatar]  [Đổi ảnh]                   │
│   cơ bản (active)│                                       │
│ • Đổi mật khẩu  │  [Tên hiển thị: Nguyễn Văn A]          │
│                 │                                        │
│                 │  [Email: user@example.com (disabled)]  │
│                 │                                        │
│                 │  [Lưu thay đổi]                        │
│                 │                                        │
│                 │  ────────────────────────────────────  │
│                 │  ⚠️ Vùng nguy hiểm                     │
│                 │  Sau khi xóa tài khoản, tất cả phiên   │
│                 │  đăng nhập sẽ bị hủy và không thể khôi │
│                 │  phục.                                 │
│                 │                                        │
│                 │  [ Xóa tài khoản ] (Nút màu đỏ)        │
└─────────────────┴────────────────────────────────────────┘
```

## Related Code Files
- **Files to create:**
  - `apps/web-1/app/dashboard/settings/profile/_components/DeleteAccountModal.tsx`
- **Files to modify:**
  - `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`
  - `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`

## Implementation Steps
1. **Bổ sung mutation `deleteAccount` vào `useProfileMutations.ts`:**
   ```typescript
   const deleteAccount = useMutation({
     mutationFn: async () => {
       const response = await apiClient.delete<{ success: boolean; message: string }>("/profile/account");
       return response.data;
     },
     onSuccess: async () => {
       notifications.show({
         title: "Thành công",
         message: "Tài khoản của bạn đã được xóa thành công.",
         color: "green",
       });
       await signOut();
       queryClient.clear();
       router.replace("/auth");
     },
     onError: (err: unknown) => {
       notifications.show({
         title: "Lỗi",
         message: extractApiErrorMessage(err) || "Không thể xóa tài khoản. Vui lòng thử lại sau.",
         color: "red",
       });
     },
   });
   ```

2. **Tạo component `DeleteAccountModal.tsx`:**
   - File: `apps/web-1/app/dashboard/settings/profile/_components/DeleteAccountModal.tsx`.
   - Props: `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => Promise<void> | void`, `isSubmitting: boolean`.
   - State: `confirmText` (string).
   - Kiểm tra `confirmText.trim().toUpperCase() === "XOA"`.

3. **Cập nhật `ProfileInfoForm.tsx`:**
   - Import `DeleteAccountModal`, `Trash2`, `Divider`, `useDisclosure` (hoặc `useState`).
   - Thêm section Vùng nguy hiểm ở cuối `ProfileInfoForm`:
     ```tsx
     <div className="pt-6 border-t border-danger/20 mt-8 space-y-3">
       <div className="flex items-center gap-2 text-danger font-heading font-semibold text-sm">
         <Trash2 className="w-4 h-4" />
         <span>Vùng nguy hiểm</span>
       </div>
       <p className="font-body text-xs text-text-muted leading-relaxed">
         Xóa vĩnh viễn tài khoản của bạn khỏi hệ thống. Tất cả phiên đăng nhập sẽ bị chấm dứt và hành động này không thể hoàn tác.
       </p>
       <Button
         color="red"
         variant="outline"
         className="font-body font-semibold text-xs h-9 cursor-pointer border-danger/30 hover:bg-danger-soft text-danger"
         onClick={() => setIsDeleteModalOpen(true)}
       >
         Xóa tài khoản
       </Button>
     </div>
     ```
   - Render `DeleteAccountModal` gắn liền với state `isDeleteModalOpen`.

## Todo List
- [ ] Bổ sung `deleteAccount` mutation vào `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`
- [ ] Tạo `apps/web-1/app/dashboard/settings/profile/_components/DeleteAccountModal.tsx`
- [ ] Tích hợp Vùng nguy hiểm và Modal vào `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`
- [ ] Kiểm tra giao diện và responsive trên màn hình mobile và desktop

## Success Criteria
- Khối "Vùng nguy hiểm" hiển thị ở cuối cùng của trang "Thông tin cơ bản".
- Nhấn "Xóa tài khoản" mở Modal xác nhận.
- Nhập đúng "XOA" mới kích hoạt nút xác nhận xóa.
- Khi hoàn tất, người dùng được đăng xuất và chuyển hướng về trang `/auth`.

## Risk Assessment & Mitigation
- **Risk:** User không biết phải gõ gì để xác nhận.
- **Mitigation:** Label và placeholder của input ghi rõ ràng "Vui lòng nhập 'XOA' để xác nhận".
- **Risk:** Cache React Query cũ lưu lại session sau khi xóa.
- **Mitigation:** Gọi `queryClient.clear()` và `signOut()` trong `onSuccess`.

## Next Steps
- Tiếp tục sang Phase 3 để viết bài kiểm thử tự động (Unit / Integration test) cho API và xác minh toàn diện.
