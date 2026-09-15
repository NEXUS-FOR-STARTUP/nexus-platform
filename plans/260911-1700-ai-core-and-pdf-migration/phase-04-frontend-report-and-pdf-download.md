# Phase 04: Giao diện Báo cáo & Tải PDF (Frontend Report & PDF Download)
> **Trạng thái:** Completed (100% Hoàn thành)


## 1. Mục tiêu (Objective)
Cung cấp giao diện trực quan trên `apps/web-1` theo chuẩn **Mantine UI v9** để sinh viên theo dõi tiến trình quét radar và đọc báo cáo phản biện chuyên sâu, tải file PDF A4 vector chính thức sau khi AI hoàn tất.

---

## 2. Quyền Sở hữu File (File Ownership)
- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx` (Modal xác nhận gói 79k 1-click)
- `apps/web-1/app/dashboard/case/[id]/_components/ActiveRadarScanning.tsx` (Màn hình radar quét tiến trình thời gian thực)
- `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx` (Giao diện hiển thị chi tiết 14 tiêu chí, điểm số và lỗi)
- `apps/web-1/app/dashboard/case/[id]/page.tsx` (Gắn kết radar scanning và tab report)

---

## 3. Các Bước Triển khai Chi tiết (Step-by-Step Implementation)

### Bước 4.1: Modal Xác nhận Thanh toán 79k (`CreditQuantityModal.tsx`)
- Đơn giản hóa thành giao diện xác nhận gói dịch vụ 79.000đ:
  - Hiển thị quyền lợi: Thẩm định 14 tiêu chí, Tra cứu 29 bẫy lỗi thực tế, Xuất file PDF vector A4.
  - Nút `[Thanh toán 79.000đ]` chuyển thẳng tới VietQR.

### Bước 4.2: Màn hình Chờ Radar Quét (`ActiveRadarScanning.tsx`)
- Khi case ở trạng thái `under_review`:
  - Hiển thị animation radar quét kèm các thông báo bước:
    * `[Đang bóc tách]` Cấu trúc ý tưởng và tài liệu nộp (Triad NMF-IPOD-CV).
    * `[Đang tra cứu]` Đối chiếu CSDL `startup_knowledge.db` (14 tiêu chí, 29 bẫy lỗi từ 12 nhóm mẫu).
    * `[Đang biên dịch]` Tính điểm cơ học và xuất bản báo cáo PDF A4.
  - Tự động kiểm tra trạng thái mỗi 3 giây qua TanStack Query.

### Bước 4.3: Nâng cấp Bảng Báo cáo Phản biện (`TabReportFindings.tsx`)
Hiển thị đầy đủ dữ liệu từ `report.json`:
1. **Điểm số & Phân hạng (Score & Verdict):**
   - Overall Score (ví dụ: `65/100`).
   - Badge phân loại:
     * Xanh lá: `READY FOR REALITY CHECK` ($\ge 80$).
     * Vàng cam: `PARTIALLY READY FOR REALITY CHECK` ($60 - 79$).
     * Đỏ: `NOT READY FOR REALITY CHECK` ($< 60$).
2. **5 Nhóm Điểm Trọng tâm (Category Scores):**
   - 5 thanh Progress bar: Độ rõ vấn đề, Tiềm năng thị trường, Mô hình kinh doanh, Rào cản cạnh tranh, Tính khả thi thực thi.
3. **14 Tiêu chí Chuẩn (Field Statuses):**
   - Dạng Accordion với trạng thái (`Good enough`, `Too vague`, `Missing`,...) và nhận xét chi tiết.
4. **Danh mục Lỗi Nghiêm trọng (Critical Weaknesses):**
   - Phân cấp `BLOCKER`, `MAJOR`, `MINOR` kèm vị trí slide, nguyên nhân cốt lõi và hướng khắc phục.
5. **Nút Tải Báo cáo PDF A4:**
   - Button Mantine:
     ```tsx
     <Button
       leftSection={<Download size={18} />}
       size="md"
       color="brand"
       onClick={() => window.open(`/api/cases/${caseId}/report/pdf`, "_blank")}
     >
       Tải Báo cáo PDF (Bản A4 Chính thức)
     </Button>
     ```

---

## 4. Tiêu chí Chấp thuận (Verification)
- Đăng ký gói 79k $\rightarrow$ Radar quét hiển thị mượt mà.
- Khi AI hoàn tất $\rightarrow$ Báo cáo hiển thị đầy đủ điểm số, danh mục lỗi.
- Bấm nút "Tải Báo cáo PDF" $\rightarrow$ Trình duyệt tải về file PDF A4 đẹp, font Merriweather rõ nét.
