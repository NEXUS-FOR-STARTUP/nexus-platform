# Demo UX — luồng chuẩn bị trước khi vào môn

Trang tĩnh mô phỏng luồng hỏi 7 bước cho sinh viên chưa có nhóm hoặc chưa có ý tưởng,
kèm một endpoint `/api/ai` để gán nhãn câu trả lời.

## Chạy

```bash
cd temp-1/demo
bun server.ts
```

Mở http://127.0.0.1:5599

- `PORT` / `HOST` đổi được bằng biến môi trường (mặc định `127.0.0.1:5599`).
- Cần `.env` trong thư mục này với `COMMAND_CODE_API_KEY`, và `models.json` để server
  tìm model. Thiếu key thì chỉ phần gọi AI lỗi; trang vẫn chạy và rơi về đoán bằng từ khoá.
- `bun install` một lần trước khi chạy.

## Ghi chú

- Dữ liệu chỉ nằm trong `localStorage` của trình duyệt, không có backend.
- Bấm "Xem kịch bản mẫu" để điền sẵn một trong sáu trường hợp và đi lại luồng.
- Hai khối "mảng việc" và "câu hội đồng" trong trang kết quả là mô phỏng, có gắn nhãn
  vàng; bản thật chấm qua `apps/api` (`/ai-engine/team-fit`).
