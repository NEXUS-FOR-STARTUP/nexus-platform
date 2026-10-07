# Phase 4: Import Stateless

Chuyển đổi luồng Import file cũ thành API phi trạng thái (không lưu database). Không đụng tới bảng nháp.

## 1. POST /api/v1/guided-documents/import
**Input:**
- Multipart File (PDF/DOCX).
- `templateId` ("cp1").

**Logic:**
- Gọi parser (ví dụ: `pdf-parse` hoặc `mammoth`) lấy text thô từ file.
- Gọi Vercel AI SDK (`@ai-sdk/google` hoặc openai) kèm prompt: "Map nội dung sau vào các câu hỏi của template CP1: [danh sách id và title]".
- Ép LLM trả về cấu trúc JSON strict (dùng `generateObject` với Zod schema).

**Output (JSON trực tiếp):**
```json
{
  "extracted": [
    { "question_id": "cp1_q1", "text": "Đoạn văn tìm được..." }
  ]
}
```

## Không lưu Database!
Frontend nhận trực tiếp response JSON này và cập nhật thẳng vào Redux/React State của form hiện tại. Sinh viên xem lại bằng mắt trên giao diện, tự so sánh, sửa tay (nếu cần), rồi mới bấm "Lưu" (chạy API PUT ở Phase 3 để lưu DB thật).