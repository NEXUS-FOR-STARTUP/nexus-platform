# Phase 04: Dashboard CTA Refactor

## Target
- `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx` (File mới)
- `apps/web-1/app/dashboard/_components/DashboardEmptyState.tsx`
- `apps/web-1/app/dashboard/page.tsx`
- `apps/web-1/components/landing/LandingHero.tsx`

## Change
1. `PackageSelectionModal.tsx`:
   - Dựng một `<Modal>` nhỏ hiển thị 2 lựa chọn: 79k và 149k. Khi user click vào, chuyển hướng (`router.push`) sang trang intake kèm `packageId` tương ứng.
2. `DashboardEmptyState.tsx` & `page.tsx`:
   - Các nút "Mua kiểm tra chuyên sâu" cũ đang trỏ thẳng về `intake?packageId=pkg_tf_audit`.
   - Đổi hành vi của nút này: Khi bấm vào thì gọi `open()` của cái `PackageSelectionModal` vừa tạo. (Sử dụng `useDisclosure` của Mantine).
3. `LandingHero.tsx`:
   - Nút "Mua kiểm tra chuyên sâu" ngoài trang chủ có thể đổi thành "Xem bảng giá" và đổi anchor trỏ cuộn xuống `#pricing` (component vừa thêm ở Phase 3).

## Acceptance
- User ở trong Dashboard bấm mua sẽ hiện Modal rất lịch sự thay vì bị sút ra trang ngoài hoặc bị lỗi vì gói `pkg_tf_audit` đã bị vô hiệu hóa.
- Chọn gói trong Modal thành công sẽ vào màn nộp hồ sơ intake với đúng mức giá.