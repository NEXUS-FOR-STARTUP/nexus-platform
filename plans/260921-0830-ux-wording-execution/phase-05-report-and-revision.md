# Phase 5: Report & Revision (Core Value Experience)

## 1. Mục tiêu & Trải nghiệm Cốt lõi
- **Tập trung vào năng lực thật:** Báo cáo phản ánh chính xác các khả năng của Nexus: phát hiện luận điểm thiếu căn cứ, chỉ ra giả định chưa chứng minh, định vị trang slide liên quan, phân loại thứ tự ưu tiên xử lý và gợi ý hành động.
- **Chuẩn hóa mức độ ưu tiên (Severity):** Không dùng taxonomy nội bộ khô cứng (`BLOCKER`, `MAJOR`, `MINOR`). Chuyển sang ngôn ngữ hướng dẫn hành động:
  - **Cần xử lý trước** (thay cho `BLOCKER`): Vấn đề quan trọng có thể làm suy yếu tính khả thi của dự án.
  - **Nên cải thiện** (thay cho `MAJOR`): Điểm còn thiếu hoặc lập luận chưa đủ chặt chẽ.
  - **Có thể hoàn thiện** (thay cho `MINOR`): Chi tiết nhỏ giúp dự án rõ ràng hơn.
- **Thân thiện hóa Phiên bản:** Bỏ `v00, v01, v02` -> dùng `Phiên bản 1, Phiên bản 2, Phiên bản 3`.
- **CTA rõ ràng cho hành động tiếp theo:** Sau khi xem báo cáo, user cần biết rõ: *Đọc nhận xét → Tải PDF → Sửa tài liệu bên ngoài → Nhấn "Đánh giá phiên bản mới"*.

---

## 2. Danh sách Files cần sửa
1. `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx`
2. `apps/web-1/app/dashboard/case/[id]/_components/RoundCard.tsx`
3. `apps/web-1/app/dashboard/case/[id]/_components/report.utils.ts`
4. `apps/web-1/app/dashboard/case/[id]/_components/documents/report-rows.ts`
5. `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceTabs.tsx`
6. `apps/web-1/app/dashboard/case/[id]/_components/CreditActions.tsx`

---

## 3. Chi tiết thay đổi

### 3.1. `report.utils.ts`
- **Chuẩn hóa nhãn loại lần nộp (`SUBMISSION_TYPE_LABELS`):**
  - `initial`: `Đánh giá lần đầu` (Thay vì `Lần đầu`)
  - `resubmit`: `Đánh giá lại` (Thay vì `Đã sửa`)
  - `logic_check`: `Kiểm tra lập luận` (Thay vì `Soi logic` mang tính đời thường thiếu trang trọng)

### 3.2. `TabReportFindings.tsx`
- **Empty State (Khi chưa có báo cáo):**
  - Tiêu đề: `Chưa có báo cáo đánh giá` (Thay vì `Chưa có báo cáo phản biện`)
  - Mô tả: *Báo cáo đánh giá chi tiết sẽ xuất hiện tại đây sau khi hệ thống hoàn tất quá trình phân tích tài liệu của nhóm.* (Bỏ chữ `thẩm định ý tưởng khởi nghiệp`).
- **Tiêu đề danh sách các lần đánh giá:**
  - Cũ: `Lịch sử đánh giá ({roundHistory.length} lượt)`
  - Mới: `Lịch sử các lần đánh giá ({roundHistory.length} phiên bản)`

### 3.3. `RoundCard.tsx`
- **Hiển thị phiên bản (Nguyên tắc bắt buộc: TRÁNH LỖI "PHIÊN BẢN 0"):**
  - Initial lifecycle unit trong hệ thống bắt đầu từ `version_no = 0` (v00).
  - **Implementation Guard:** Kiểm tra kỹ model và data path trước khi render: chỉ cộng `+1` khi nguồn dữ liệu truyền vào là zero-based lifecycle index (`version_no = 0, 1, 2...`); không cộng dồn nếu nguồn dữ liệu đã được helper chuẩn hóa thành 1-based từ trước.
  - UI hiển thị `displayVersion` qua logic: `round.version_no !== undefined ? round.version_no + 1 : round.round`
    - `version_no = 0` (v00) -> **Phiên bản 1**
    - `version_no = 1` (v01) -> **Phiên bản 2**
    - `version_no = 2` (v02) -> **Phiên bản 3**
  - Header: `Phiên bản ${displayVersion}` kèm ngày giờ định dạng tiếng Việt rõ ràng.
- **Nút hành động PDF:**
  - Nút xem (Chốt duy nhất): `Mở xem toàn màn hình`
  - Nút tải: `Tải báo cáo PDF` (Thay vì `Tải PDF` chung chung)
- **Tiêu đề badge:** Hiển thị `Đánh giá lần đầu` hoặc `Đánh giá lại` với màu sắc trực quan (xanh / cam).

### 3.4. `CreditActions.tsx` & Các nút Trigger Đánh giá lại
- **Trường hợp đã có báo cáo và nhóm muốn chạy vòng mới:**
  - Tiêu đề hành động: `Đánh giá phiên bản tài liệu mới`
  - Mô tả: *Tải lên slide hoặc đề cương đã được nhóm chỉnh sửa để đối chiếu tiến độ hoàn thiện.*
  - Nút bấm:
    - Nếu còn lượt: `Bắt đầu đánh giá phiên bản mới (Dùng 1 lượt)`
    - Nếu hết lượt: `Mua gói đánh giá mới (79.000đ / 2 lượt)`

### 3.5. Mapping Severity trong Parser Báo cáo (Nếu có rendered component)
- Định nghĩa helper hiển thị mức độ vấn đề:
  ```ts
  export const SEVERITY_DISPLAY: Record<string, { label: string; color: string }> = {
    BLOCKER: { label: "Cần xử lý trước", color: "red" },
    MAJOR: { label: "Nên cải thiện", color: "orange" },
    MINOR: { label: "Có thể hoàn thiện", color: "blue" },
  };
  ```
- Tuyệt đối không để text `BLOCKER` nguyên bản xuất hiện trên giao diện sinh viên.

---

## 4. Checklist kiểm tra & Tiêu chí nghiệm thu (Verification)

1. **Build & Type Check:**
   ```bash
   bun run check-types
   ```
2. **Grep cấm từ trong Báo cáo & Phiên bản:**
   ```bash
   grep -E "Soi logic|thẩm định ý tưởng khởi nghiệp|BLOCKER" 'apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx' 'apps/web-1/app/dashboard/case/[id]/_components/RoundCard.tsx' 'apps/web-1/app/dashboard/case/[id]/_components/report.utils.ts'
   ```
   *Kỳ vọng:* Không còn `Soi logic`, không còn từ ngữ hành chính `thẩm định`.
3. **Kiểm tra trực quan (UI Verification):**
   - Header thẻ RoundCard hiển thị rõ: `Phiên bản 1`, `Phiên bản 2`.
   - Nút bấm ghi rõ: `Tải báo cáo PDF`.
   - Empty state nhẹ nhàng, hướng dẫn rõ ràng.
   - Nút đánh giá lại giải thích rõ ràng việc tiêu hao lượt đánh giá.
