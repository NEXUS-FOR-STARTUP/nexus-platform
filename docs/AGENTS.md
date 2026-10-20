# AGENTS.md cho `docs/`

## Mục đích

`docs/` business-first, PRD-led. Giữ business context, product scope, requirement, flow, technical note, archive trong một trục rõ.

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

- `db-query-guide.md` — truy vấn DB an toàn (READONLY_DATABASE_URL).
- `db-backup-guide.md` — backup DB (pg_dump via Docker, self-hosted Postgres 18.4 trên VPS).
- `db-migration-guide.md` — migration Prisma (generate/migrate/deploy).
- `docker-build-push-guide.md` — build/push Docker image API + Web.
- `ci-guide.md` — CI/CD GitHub Actions.
- `deploy-log.md` — log deploy image lên Docker Hub (commit/branch/message).

## Tài liệu legacy & tham khảo lịch sử (Non-canonical)

> ⛔ **CẢNH BÁO AI AGENTS:** Thư mục dưới KHÔNG PHẢI source of truth cho code. KHÔNG trích quyết định kỹ thuật từ đây làm căn cứ triển khai:
- `archive/` — specs + architecture cũ đã bị thay thế (gồm `archive/reference/` ghi chép tham khảo nghiệp vụ).
- `research/` — nghiên cứu giải pháp, root-cause analysis (RCA), benchmark quá khứ.
- `nexus-document/` — kho tài liệu học thuật (CP1-CP4, slide, biên bản phỏng vấn, mentor feedback).
- `journals/` — nhật ký hằng ngày team dev (53 files); chỉ ghi lịch sử commit/deploy, không phải đặc tả kỹ thuật hiện hành.

## Quy tắc đặt tài liệu mới

1. Đặt đúng lớp canonical.
2. Thuộc business context, PRD, flow, requirement, technical note: cập nhật file canonical hiện có trước.
3. Không tạo top-level folder docs mới nếu chưa có lý do rõ.
4. Tên file ngắn, đúng chủ đề, tránh trùng nghĩa.
5. Tài liệu vận hành (DB guide, backup guide) đặt root `docs/`, không tạo folder riêng.

## `nexus-document/` — Tài liệu nguồn

[`nexus-document/`](./nexus-document/) = kho **tài liệu gốc học thuật & vận hành** (bài nộp checkpoint, transcript mentoring, feedback GV, tài liệu hướng dẫn).

- **Không** sửa nội dung business trong file CP.
- **Không** dùng `nexus-document/` làm nguồn implementation — dùng `docs/` chính cho PRD, requirements, flows.
- **Cần ngữ cảnh business** (số liệu phỏng vấn, value proposition, PMF): tham khảo `nexus-document/` trước, rồi cập nhật `docs/project-context.md` hoặc `docs/prd/` tương ứng.
- **Cấu trúc `nexus-document/` theo CP** — xem [`structure-map.md`](./nexus-document/structure-map.md) để navigate.
- **`overview.md`** trong `nexus-document/` = overview business, không phải product overview.

## backlog/

`backlog/` chứa structured future work items — mỗi file một ý tưởng/việc kèm context, decisions, notes, gotchas. Khác `plans/` (execution workspace) và `requirements/` (feature canonical). File có status (Draft → Researching → Planned → In Progress → Done → Deferred → Rejected). Item sang Planned → tạo plan trong `plans/`. Done → update `CHANGELOG.md` ở root, cân nhắc archive.

## journals/

`journals/` chứa nhật ký hoàn thành implementation (1 file/ngày). Không phải tài liệu sản phẩm — không làm source of truth cho business hay architecture. Feature shipped xong, journal có thể archive, không ảnh hưởng docs chính.

## Quy tắc cập nhật

- Không bịa API, kiến trúc, env key, runtime flow chưa thấy trong code/docs xác nhận.
- Sửa file canonical trước: `project-context.md`, `prd/core-product-prd.md`, `flows/*`, `requirements/*`, `technical-notes/*`.
- Không dùng `archive/` làm nơi cập nhật chính.
- Giữ tài liệu ngắn, quét nhanh, tách ý theo heading rõ.
- Cần nguồn ngoài cho Hono, Better Auth, Mantine UI, TanStack, lib khác: dùng `docs/tech-doc-urls.txt`.
- Bám quy ước repo: một root `.env`, auth/session ở `apps/api`, Prisma plural table + snake_case, web app ở `apps/web-1`.

## Chọn nơi sửa

- Business context: sửa `project-context.md`.
- Product scope: sửa `prd/core-product-prd.md`.
- Feature behavior: sửa `requirements/*` + `flows/*`.
- Technical impact: sửa `technical-notes/*`.
- Legacy/trace: xem `archive/`.

## Khi làm AI agent

- Cần bối cảnh nhanh: đọc `codebase-summary.md`.
- Ưu tiên sửa file canonical, không tạo bản chéo dư thừa.
- Thiếu dữ liệu: ghi `Missing`, `Unclear`, `Needs decision`, hoặc `Assumption`.
- Chỉ ghi điều kiểm tra được từ repo hiện tại hoặc docs đã xác nhận.

## ai-rules/

`ai-rules/` chứa quy tắc AI agent khi làm documentation. Bổ trợ `.agents/rules/` — tập trung documentation-specific rules (vd: `documentation-rules.md`).
