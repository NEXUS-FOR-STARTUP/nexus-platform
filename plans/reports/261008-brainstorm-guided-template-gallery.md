# Brainstorm — Guided Documents Template Gallery (2026-10-08)

## Problem
- `GuidedDocumentsWorkspace.tsx:118` chọn template bằng `SegmentedControl` hardcode `cp1 | cp2`.
- Không scale khi có nhiều template (user xác nhận có lộ trình thêm).
- Sidebar label hardcode "Soạn thảo CP1/CP2" (`WorkspaceSidebar.tsx:44`).

## Constraint
- Answers gắn `case_id` (`ProjectAnswer`) → template là nhập liệu của case, không phải tài liệu độc lập.
- Case workspace là SPA sidebar + `?tab=` URL sync.

## Approaches
| | Mô tả | Kết luận |
|---|---|---|
| A | Gallery trong tab `guided`, view state qua `&template=<key>` | **Chọn** |
| B | Route con `/dashboard/case/[id]/guided/[key]` | Bỏ: dựng lại layout/sidebar, lệch SPA |
| C | Giữ tab, restyle | Bỏ: không scale |
| — | Mục nav riêng trên dashboard | Bỏ: phải hỏi lại "case nào", tách answers khỏi case |

## Decision
1. `?tab=guided` → grid thẻ đứng tỉ lệ A4; bìa vẽ bằng CSS từ catalog (title, phase list mờ, progress bar); dưới thẻ: tên + "x/y câu" + trạng thái.
2. Click → `?tab=guided&template=<key>` → editor hiện tại (TOC + question card) + breadcrumb "← Tất cả biểu mẫu".
3. Bỏ `SegmentedControl`; sidebar label → "Soạn thảo tài liệu".
4. Catalog `@repo/validation` thêm metadata registry (`key`, `title`, `description`, `order`); type key suy từ registry, bỏ union `"cp1" | "cp2"` hardcode.
5. `template` param không hợp lệ → về gallery.

## Must verify before implement
- Shape export hiện tại của `packages/validation/src/catalogs/index.ts`.
- cp1/cp2 có trùng `question_id` không (ảnh hưởng đếm progress trên thẻ).
- API `generate-docx` / `get-answers` nhận template key dạng gì (enum Zod hardcode?).

## Risks
- Gallery 2 thẻ trông trống → progress/status trên thẻ là giá trị chính.
- Responsive: student workspace mobile → grid 2 cột mobile, 3–4 desktop.

## Success
- Thêm template mới = thêm 1 entry catalog, không sửa UI/type.
- Back/forward browser + share link giữ đúng view.
- `bun run check-types` pass; smoke trên browser: gallery → editor → back.
