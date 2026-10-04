# Phase 2: Frontend Case Workspace - Hide Chat for 79k Package

## Mục tiêu
Ẩn tab "Chat với Supporter" trong giao diện Case Workspace đối với các hồ sơ thuộc gói 79k (`pkg_ai_audit`), đồng thời ngăn chặn truy cập trực tiếp và tắt sub realtime chat không cần thiết.

## Chi tiết kỹ thuật

### 1. `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`
- Bổ sung prop `isAiPackage?: boolean` (hoặc nhận `packageId?: string`) vào `WorkspaceSidebarProps`.
- Điều kiện hiển thị tab `discussion`:
  ```tsx
  ...(!isPreSubmission && !isAiPackage
    ? [
        {
          id: "discussion" as const,
          label: "Chat với Supporter",
          icon: MessageCircle,
          count: unreadCount ?? messageCount,
        },
      ]
    : []),
  ```

### 2. `apps/web-1/app/dashboard/case/[id]/page.tsx`
- Xác định cờ `isAiPackage`:
  ```tsx
  const isAiPackage = caseData?.package_id === "pkg_ai_audit";
  ```
- Truyền `isAiPackage={isAiPackage}` vào `<WorkspaceSidebar ... />`.
- Cập nhật hàm kiểm tra tab hợp lệ `isTabAvailable`:
  ```tsx
  const isTabAvailable = (tab: WorkspaceTab): boolean => {
    if (isAiPackage && tab === "discussion") return false;
    if (!isPreSubmission) return true;
    if (stage === "intake_pending") return tab === "overview" || tab === "timeline" || tab === "settings" || tab === "credits";
    if (stage === "intake_ready") return tab === "overview" || tab === "documents" || tab === "timeline" || tab === "settings" || tab === "credits";
    return true;
  };
  ```
- Thêm hiệu ứng an toàn reset tab nếu người dùng đang ở `discussion` mà case là `isAiPackage`:
  ```tsx
  useEffect(() => {
    if (isAiPackage && activeTab === "discussion") {
      setActiveTab("overview");
    }
  }, [isAiPackage, activeTab]);
  ```
- Kiểm tra điều kiện render component:
  ```tsx
  {activeTab === "discussion" && !isAiPackage && <TabDiscussionChat caseId={caseData.id} />}
  ```
- Tối ưu sub Centrifugo realtime chat:
  - Trong `useRealtimeChat(id, { activeTab, markAsRead })`, truyền thêm flag hoặc chỉ kích hoạt khi `!isAiPackage`.
  - Giúp tiết kiệm tài nguyên kết nối WebSocket Centrifugo khi khách hàng ở gói 79k.

## Tiêu chí hoàn thành (Acceptance Criteria)
- Mở hồ sơ gói 79k (`pkg_ai_audit`): Thanh bên Workspace không hiển thị biểu tượng/nút "Chat với Supporter".
- Người dùng không thể chuyển sang tab discussion.
- Các hồ sơ gói khác (ví dụ `pkg_tf_audit` nếu còn) vẫn hiển thị tab discussion bình thường.
- Không có lỗi type checking hay console error.
