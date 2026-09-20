# Phase 5: Nâng cấp Giao diện Admin Worker Monitoring (Job ID & Search)

**Mục tiêu:** Cải tiến giao diện Giám sát Worker để định danh chuẩn theo **Job ID** (mỗi dòng là một lượt chạy máy tính/worker cụ thể), hiển thị số lần chạy (`attemptNo`), liên kết rõ ràng với Mã Case, và hỗ trợ tìm kiếm đa năng theo cả Job ID và Case.

---

## 1. Cập nhật Backend (`apps/api/src/modules/admin`)

### 1.1. Bổ sung trường vào `packages/validation/src/index.ts`:
Cập nhật `AdminWorkerJobListItem`:
```typescript
export interface AdminWorkerJobListItem {
  id: string;              // Job ID duy nhất (UUID)
  caseId: string;
  caseCode: string;
  projectName: string;
  studentName: string;
  studentEmail: string;
  status: string;
  isStuck: boolean;
  submissionType: string;
  attemptNo: number;       // Lần chạy thứ mấy của Case này (1, 2, 3...)
  model: string;
  startedAt: string;
  updatedAt: string;
  durationMs: number;
}
```

### 1.2. Mở rộng Search trong `admin-workers.service.ts`:
Hỗ trợ tìm kiếm theo cả `Job ID` (UUID đầy đủ hoặc chuỗi ký tự đầu):
```typescript
if (query.search && query.search.trim()) {
  const term = query.search.trim();
  where.OR = [
    { id: { contains: term, mode: "insensitive" } },
    {
      case: {
        OR: [
          { case_code: { contains: term, mode: "insensitive" } },
          { team_name: { contains: term, mode: "insensitive" } },
          { owner: { name: { contains: term, mode: "insensitive" } } },
          { owner: { email: { contains: term, mode: "insensitive" } } },
        ],
      },
    },
  ];
}
```

---

## 2. Cập nhật Bảng Giám sát (`WorkerJobsTable.tsx`)

### 2.1. Cấu trúc các cột mới:

| Cột | Tiêu đề | Nội dung hiển thị |
| :--- | :--- | :--- |
| **1** | **Job ID** | - Mã Job rút gọn (font mono, ví dụ: `ai-8f28...`) kèm nút Copy nhanh.<br>- Badge lượt chạy: `Lần 1`, `Lần 2` (màu cyan/blue).<br>- Nhãn loại nộp: `Lần đầu`, `Đã sửa`, `Soi logic`. |
| **2** | **Mã Case & Đề tài** | - Mã Case: `CASE-2026-XXXX` (font mono, click mở nhanh Case Detail).<br>- Tên đề tài khởi nghiệp (cắt gọn truncate). |
| **3** | **Sinh viên** | Họ tên & Email sinh viên chủ nhiệm đề tài. |
| **4** | **Model AI** | Badge hiển thị chuẩn xác model đã chạy (Gemini, GPT-5.6 Sol, Mimo...). |
| **5** | **Thời gian** | Đồng hồ Live đếm giây nếu đang chạy, hoặc thời lượng hoàn tất (vd: `2m 45s`) + thời điểm bắt đầu. |
| **6** | **Trạng thái** | Badge trạng thái: `Đang chờ`, `Đang chạy`, `Hoàn thành`, `Thất bại`, `Kẹt`. |
| **7** | **Thao tác** | Xem chi tiết (mở Drawer), Giải cứu kẹt, Hủy, Chạy lại. |

### 2.2. Thanh tìm kiếm:
Placeholder cập nhật thành:  
`placeholder="Tìm Job ID, mã case, đề tài, sinh viên..."`

---

## 3. Cập nhật Drawer Chi tiết (`WorkerJobDetailDrawer.tsx`)
- Hiển thị nổi bật **Job ID** ở đầu Drawer kèm nút Copy.
- Hiển thị badge: `Lần chạy thứ {attemptNo}` của Case `{caseCode}`.
- Tab Files: Đọc và hiển thị danh sách file `input/` và `output/` của đúng lượt chạy đó.
- Tab Terminal: Xem đúng log ghi nhận của lượt chạy đó.

---

## 4. Tiêu chí Nghiệm thu Phase 5
1. Admin nhìn vào bảng thấy ngay danh sách các Job theo thứ tự thời gian mới nhất.
2. Với một Case chạy 2 lần (initial và retry), bảng hiển thị 2 dòng riêng biệt:
   - Dòng 1: Job ID #2 - Lần 2 - Model X - Trạng thái Y.
   - Dòng 2: Job ID #1 - Lần 1 - Model Z - Trạng thái Hoàn thành.
3. Nhập 4-6 ký tự đầu của Job ID vào ô Search tìm kiếm ra ngay đúng job đó.
