# tasks/ — Quy tắc cho agent

## Excel

- Mọi thao tác với file Excel trong thư mục này (tạo/sửa/phân tích `.xlsx`) PHẢI dùng skill `ck:xlsx`.
- Công thức thật, không hardcode giá trị; file xuất ra phải ZERO formula errors (`#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`).
- Giữ nguyên format/template có sẵn; không áp chuẩn mới đè lên file cũ.

## Nguồn sự thật & đồng bộ

- `gap-analysis-tasks.md` (bảng Master) là nguồn sự thật nội dung task; `gap-analysis-tasks.xlsx` là mirror để quản lý/báo cáo.
- Sửa dữ liệu task trong md, rồi chạy để sinh lại xlsx:

  ```bash
  uv run --with openpyxl python build-gap-analysis.py
  ```

- Sửa trực tiếp xlsx sẽ bị ghi đè ở lần build sau.
- Cột **Báo cáo**: task `Done` trỏ journal `docs/journals/`. Không viết lại Mô tả / Acceptance / Ghi chú — chỉ tick Status + điền Báo cáo.

- Script tự tính kết quả công thức Overview, nhúng cached values vào XML và verify (output bắt chước `recalc.py`).

## Lưu ý môi trường

- Dev env không có LibreOffice → không chạy được `recalc.py` của skill `ck:xlsx`; script build dùng cách verify thay thế ở trên. Nếu có LibreOffice, verify chuẩn: `python recalc.py gap-analysis-tasks.xlsx`.
