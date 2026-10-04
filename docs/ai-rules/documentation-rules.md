# Quy tắc tài liệu

## 1. Triết lý tài liệu

Dự án này dùng mô hình business-first, PRD-led.

Thứ tự ưu tiên:

`Business -> Product -> Requirement -> Technical`

## 2. Tài liệu canonical

AI chỉ được coi các file sau là source of truth chính:

- `docs/project-context.md`
- `docs/prd/core-product-prd.md`
- `docs/flows/*.md`
- `docs/requirements/*.md`
- `docs/technical-notes/*.md`
- `docs/system-architecture.md`
- `docs/codebase-summary.md`
- `docs/code-standards.md`

`docs/archive/`, `docs/research/`, `docs/nexus-document/`, và `docs/journals/` là tài liệu lịch sử / tham khảo, KHÔNG ĐƯỢC dùng làm source of truth kỹ thuật cho code.

## 3. Quy tắc tạo file

- Không tạo top-level folder `docs/` mới nếu chưa có lý do rõ.
- Không tạo file mới nếu thông tin thuộc file canonical đã có.
- Nếu còn nghi ngờ, ưu tiên sửa file canonical trước.

## 4. Quy tắc business-first

- Không viết technical note trước khi business context và product scope đã rõ.
- Không viết API, DB, hay architecture như source of truth cho feature nếu PRD hoặc requirement chưa có.

## 5. Quy tắc chống duplicate

- Không duplicate cùng một định nghĩa, rule, scope statement, hoặc feature rationale ở nhiều file.
- File khác chỉ được tóm tắt ngắn và link về file canonical.

## 6. Quy tắc nhận feature

Không thêm feature vào MVP nếu không trace được chuỗi:

`Business reason -> Target customer -> User problem -> Product behavior -> Functional requirement -> User story -> Acceptance criteria`

## 7. Quy tắc thiếu dữ liệu

Nếu thiếu dữ liệu, phải đánh dấu một trong các nhãn sau:

- `Missing`
- `Unclear`
- `Needs decision`
- `Assumption`

Không được tự bịa:

- target user
- business goal
- scope boundary
- feature rationale
- success metric

## 8. Quy tắc archive & tài liệu phi chuẩn (Non-canonical)

- `docs/archive/`, `docs/research/`, `docs/nexus-document/`, `docs/journals/` là nơi chứa tài liệu legacy, nghiên cứu cũ, bài nộp học thuật hoặc nhật ký hàng ngày — KHÔNG PHẢI nguồn chuẩn kỹ thuật.
- Tuyệt đối không trích dẫn các nhận định trong các thư mục trên để áp đặt quyết định code (ví dụ: cấm chat, mô hình audit round cũ, hay các API giả định).
- Không cập nhật tài liệu cũ như document chính.
- Nếu cần dùng lại nội dung cũ, phải rút ra và đưa vào canonical docs mới.

## 9. Cách chỉnh sửa

Khi cập nhật docs:

1. sửa file canonical
2. giảm duplicate
3. thêm link giữa các docs liên quan
4. chỉ tạo file mới nếu file cũ sẽ trở nên quá trộn chủ đề hoặc khó bảo trì
