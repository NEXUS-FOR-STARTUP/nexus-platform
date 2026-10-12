# Phase 5: Frontend Workspace

Giao diện điền form cho sinh viên. Rất nhẹ nhàng, không rào cản đỏ rực phiền toái.

## 1. Cơ chế Khóa 1 Chiều (Visual Lock)
- Khởi tạo form state cục bộ: `answers: Record<string, string>`.
- Lặp qua từng câu hỏi trong `TemplateDef` để render ô Textarea.
- **Điều kiện mở khóa cho từng câu:**
  ```typescript
  const isUnlocked = !question.unlock_requires || 
                     question.unlock_requires.every(reqId => answers[reqId]?.trim().length > 0);
  ```
- Nếu `!isUnlocked` → Form bị mờ (opacity 0.5, vô hiệu hóa pointer-events) và `disabled=true`. Thêm dòng text nhỏ: "Hãy trả lời câu X trước".
- **Khi user quay lại sửa câu cũ:** State thay đổi, câu sau KHÔNG BỊ KHÓA LẠI (vì hàm `every` kiểm tra độ dài text vẫn > 0). Không sinh ra cờ lỗi `needs_review`. Trách nhiệm tính nhất quán là của con người.

## 2. Nút Lưu
- Nút Save gửi toàn bộ các key bị thay đổi lên `PUT` API. Có thể làm debounce auto-save.