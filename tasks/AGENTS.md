# tasks/ — Quy tắc cho agent

## Excel

- Mọi thao tác file Excel trong thư mục này (tạo/sửa/phân tích `.xlsx`) PHẢI dùng skill `ck:xlsx`.
- Công thức thật, không hardcode giá trị; file xuất ZERO formula errors (`#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`).
- Giữ format/template có sẵn; không áp chuẩn mới đè file cũ.

## Nguồn sự thật

- `gap-analysis-tasks.md` (bảng Master) = nguồn sự thật nội dung task; `gap-analysis-tasks.xlsx` = bảng tính quản lý/báo cáo.
- Cột **Báo cáo**: task `Done` trỏ journal `docs/journals/`. Không viết lại Mô tả / Acceptance / Ghi chú — chỉ tick Status + điền Báo cáo.

- Dev env không có LibreOffice → không chạy được `recalc.py` của skill `ck:xlsx`; script build dùng cách verify thay thế ở trên. Có LibreOffice → verify chuẩn: `python recalc.py gap-analysis-tasks.xlsx`.
