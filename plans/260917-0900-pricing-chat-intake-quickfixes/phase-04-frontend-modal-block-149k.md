# Phase 4: Frontend Modal - Block 149k Package

## Mục tiêu
Ngăn chặn người dùng chọn gói 149k (`pkg_supporter_audit` - Premium Mentor Audit) từ `PackageSelectionModal` trong Dashboard bằng thông báo Mantine notification báo tính năng đang phát triển.

## Chi tiết kỹ thuật

### 1. `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx`
- Import Mantine notifications:
  ```tsx
  import { notifications } from "@mantine/notifications";
  ```
- Cập nhật hàm `handleSelect` hoặc trực tiếp xử lý sự kiện click của nút "Chọn Premium":
  ```tsx
  const handleSelect = (packageId: string) => {
    if (packageId === PACKAGE_KEYS.SUPPORTER_AUDIT) {
      notifications.show({
        title: "Tính năng đang được phát triển",
        message: "Gói Premium Mentor Audit hiện đang được hoàn thiện. Vui lòng chọn gói Basic AI Audit (79.000đ) để được hỗ trợ tức thì!",
        color: "blue",
      });
      return;
    }

    if (onSelectPackage) {
      onSelectPackage(packageId);
    } else {
      router.push(`/dashboard/intake?packageId=${packageId}`);
    }
    onClose();
  };
  ```
- Tại thẻ gói "Premium Mentor Audit", nút "Chọn Premium":
  - Khi click: gọi `handleSelect(PACKAGE_KEYS.SUPPORTER_AUDIT)`.
  - Không đóng modal (hoặc giữ nguyên modal), bắn thông báo màu xanh dương (`color: "blue"`) với thông điệp rõ ràng.
  - User không bị chuyển trang vào `/dashboard/intake?packageId=pkg_supporter_audit`.

## Tiêu chí hoàn thành (Acceptance Criteria)
- Trong Dashboard, mở `PackageSelectionModal` (khi bấm tạo case hoặc mua kiểm tra chuyên sâu).
- Click nút "Chọn Basic" (79k) -> Hoạt động bình thường, chuyển sang intake với `packageId=pkg_ai_audit`.
- Click nút "Chọn Premium" (149k) -> Hiển thị notification: "Tính năng đang được phát triển", không chuyển trang và không phát sinh lỗi.
