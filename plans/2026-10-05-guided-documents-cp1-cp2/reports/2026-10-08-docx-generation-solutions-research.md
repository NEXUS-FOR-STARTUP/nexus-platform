# Báo cáo Nghiên cứu Kỹ thuật: Các giải pháp sinh DOCX Production & Lộ trình Nâng cấp Template-driven

**Ngày thực hiện:** 2026-10-08  
**Trạng thái:** Tạm thời chọn **`docx` (npm)** cho MVP; Lưu trữ giải pháp **Template-driven (`docxtemplater`)** làm phương án nâng cấp khi cần.

---

## 1. Quyết định Hiện tại: `docx` (npm) - Code-first

### Tại sao chọn cho MVP hiện tại?
- **Triết lý Ponytail:** Tối giản hạ tầng, không phát sinh chi phí, không phụ thuộc ngoại vi.
- **Ưu điểm:**
  - 100% mã nguồn mở (MIT), miễn phí hoàn toàn.
  - Chạy native bằng JavaScript/TypeScript trong Bun/Node.js, không cần Java, LibreOffice hay container phụ trợ.
  - Hàm `Packer.toBuffer()` xử lý trực tiếp trên RAM (~50ms), đẩy thẳng lên Cloudinary mà không tốn dung lượng ổ cứng VPS.
- **Ranh giới chấp nhận (Ceiling / Trade-off):**
  - Layout và style (font, margin, headings) được cấu hình bằng code TypeScript. Nếu cấu trúc đề bài hoặc format của trường thay đổi nhiều, developer phải can thiệp sửa code.

---

## 2. Giải pháp Nâng cấp Dự phòng: Template-driven (`docxtemplater`)

Nếu sau này muốn người không chuyên (PM, Supporter, Mentor) có thể tự cập nhật mẫu văn bản mà **không cần sửa một dòng code nào**, giải pháp chuẩn công nghiệp là chuyển sang **Template-driven**.

### Cơ chế hoạt động:
1. **Thiết kế mẫu bằng Word:**
   - Lấy trực tiếp file Word mẫu CP1/CP2 của trường (có sẵn trang bìa, logo trường, header, footer, style Times New Roman chuẩn).
   - Đặt các placeholder theo quy ước: `{cp1_q1}`, `{cp1_q2}`, `{project_name}`, `{members}`...
   - Lưu file mẫu vào thư mục tĩnh của Backend: `apps/api/src/modules/guided-documents/templates/files/cp1_template.docx` (hoặc upload lên Cloudinary).
2. **Backend nạp dữ liệu (Đơn giản hơn cả code-first):**
   - Đọc buffer file template mẫu.
   - Nạp object JSON câu trả lời từ DB vào.
   - `docxtemplater` tự động tìm và thay thế placeholder, giữ nguyên 100% định dạng, bảng biểu, trang bìa của file Word gốc.

### Mã nguồn tham khảo khi chuyển đổi sang `docxtemplater`:

```bash
bun add docxtemplater pizzip
```

```typescript
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "node:fs";
import path from "node:path";

export async function generateDocxFromTemplate(
  templateName: "cp1" | "cp2",
  answersMap: Record<string, string>
): Promise<Buffer> {
  // 1. Đọc file Word mẫu
  const templatePath = path.resolve(__dirname, `files/${templateName}_template.docx`);
  const content = fs.readFileSync(templatePath, "binary");

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true, // Tự động nhận diện ký tự xuống dòng \n của câu trả lời
  });

  // 2. Render dữ liệu
  doc.render(answersMap);

  // 3. Xuất ra Buffer để đẩy lên Cloudinary
  const buf = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buf;
}
```

---

## 3. Khi nào nên kích hoạt phương án Template-driven?

Chuyển đổi từ `docx` (npm) sang `docxtemplater` khi xảy ra một trong các điều kiện sau:
1. **Trường học yêu cầu khắt khe về trình bày:** Bắt buộc có trang bìa chuẩn, khung viền, logo trường, bảng phân công nhiệm vụ mà code bằng thư viện `docx` quá tốn công căn chỉnh.
2. **Mẫu thay đổi liên tục:** Giảng viên/Mentor cập nhật template mỗi kỳ, cần cho phép upload file `.docx` mới mà không muốn phải deploy lại code backend.
3. **Sinh viên phàn nàn về format:** File xuất ra từ code bị lệch căn lề hoặc mất tính thẩm mỹ so với file Word gốc của trường.

*Báo cáo này được lưu lại để đội ngũ kỹ thuật có sẵn blueprint triển khai ngay lập tức khi có nhu cầu nâng cấp.*
