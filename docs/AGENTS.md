# AGENTS.md cho `docs/`

## Mục đích

`docs/` dùng business-first, PRD-led. Giữ business context, product scope, requirement, flow, technical note, archive trong một trục rõ.

## Tài liệu canonical

- `project-context.md` - business context canonical.
- `prd/core-product-prd.md` - product scope canonical.
- `flows/` - user flow + operational flow canonical.
- `requirements/` - functional requirement canonical.
- `technical-notes/` - technical note tối thiểu sau khi product scope rõ.
- `system-architecture.md` — kiến trúc hệ thống hiện trạng.
- `project-overview-pdr.md` — MVP demo realignment PDR.

## Tài liệu hỗ trợ

- `codebase-summary.md` - tóm tắt codebase.
- `code-standards.md` - chuẩn code.
- `tech-doc-urls.txt` - nguồn docs ngoài ưu tiên.

## Tài liệu vận hành

- `db-query-guide.md` — hướng dẫn truy vấn DB an toàn (READONLY_DATABASE_URL).
- `db-backup-guide.md` — hướng dẫn backup DB (pg_dump via Docker).

## Tài liệu legacy

- `archive/` - legacy reference, không phải source of truth.

## Quy tắc đặt tài liệu mới

1. Đặt vào đúng lớp canonical.
2. Nếu thuộc business context, PRD, flow, requirement, technical note: cập nhật file canonical hiện có trước.
3. Không tạo top-level folder docs mới nếu chưa có lý do rõ.
4. Giữ tên file ngắn, mô tả đúng chủ đề, tránh trùng nghĩa.
5. Tài liệu vận hành (DB guide, backup guide) đặt ở root `docs/`, không tạo folder riêng.

## `nexus-document/` — Tài liệu nguồn

[`nexus-document/`](./nexus-document/) là kho **tài liệu gốc học thuật & vận hành** (bài nộp checkpoint, transcript mentoring, feedback GV, tài liệu hướng dẫn).

- **Không** sửa nội dung business trong các file CP.
- **Không** dùng `nexus-document/` làm nguồn cho implementation — dùng `docs/` chính cho PRD, requirements, flows.
- **Khi cần ngữ cảnh business** (số liệu phỏng vấn, mô tả value proposition, PMF), tham khảo `nexus-document/` trước rồi cập nhật `docs/project-context.md` hoặc `docs/prd/` tương ứng.
- **Cấu trúc `nexus-document/` được tổ chức theo CP** — xem [`structure-map.md`](./nexus-document/structure-map.md) cho navigation.
- **`overview.md`** trong `nexus-document/` là overview business, không phải product overview.

## journals/

`journals/` chứa nhật ký hoàn thành implementation (1 file/ngày). Không phải tài liệu sản phẩm — không dùng làm source of truth cho business hay architecture. Sau khi feature shipped, journal có thể archive mà không ảnh hưởng docs chính.

## Quy tắc cập nhật

- Không tự bịa API, kiến trúc, env key, runtime flow chưa thấy trong code/docs xác nhận.
- Sửa file canonical trước: `project-context.md`, `prd/core-product-prd.md`, `flows/*`, `requirements/*`, `technical-notes/*`.
- Không dùng `archive/` làm nơi cập nhật chính.
- Giữ tài liệu ngắn, quét nhanh, tách ý theo heading rõ.
- Dùng `docs/tech-doc-urls.txt` khi cần nguồn ngoài cho Hono, Better Auth, Mantine UI, TanStack, hoặc thư viện khác.
- Bám quy ước repo: một root `.env`, auth/session ở `apps/api`, Prisma plural table + snake_case, web app ở `apps/web-1`.

## Chọn nơi sửa

- Business context: sửa `project-context.md`.
- Product scope: sửa `prd/core-product-prd.md`.
- Feature behavior: sửa `requirements/*` và `flows/*`.
- Technical impact: sửa `technical-notes/*`.
- Legacy/trace: xem `archive/`.

## Khi làm AI agent

- Đọc `codebase-summary.md` nếu cần bối cảnh nhanh.
- Ưu tiên sửa file canonical, không tạo bản chéo dư thừa.
- Nếu thiếu dữ liệu, ghi `Missing`, `Unclear`, `Needs decision`, hoặc `Assumption`.
- Chỉ ghi những gì kiểm tra được từ repo hiện tại hoặc docs đã xác nhận.

## ai-rules/

`ai-rules/` chứa quy tắc cho AI agent khi làm việc với documentation. Bổ trợ cho `.agents/rules/` — tập trung vào documentation-specific rules (ví dụ: `documentation-rules.md`).
