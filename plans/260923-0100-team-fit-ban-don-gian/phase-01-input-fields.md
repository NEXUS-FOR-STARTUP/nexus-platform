# Phase 01: ô chọn mảng nghề cho thành viên

> Trạng thái: xong (agent Phase01RoleTrack: 6 file đổi — 5 file plan + fixture test bắt buộc; tsc 0 lỗi 3 workspace; test 8/8 pass; 11 preset/54 member pass schema; UI thật đã chạy Chromium; 2 lệch đã ghi: ROLE_TRACK đặt trước section Team-Idea Fit vì TDZ zod v4, formatIssue thêm nhánh enum tiếng Việt).

## Vì sao

Máy đếm ở Phần A cần biết mỗi thành viên thuộc mảng nào. Chữ tự do không đếm được ("chạy fanpage" là marketing nhưng không có từ nào để bắt). Nên thêm 1 ô chọn bắt buộc.

## File sửa

- `packages/validation/src/index.ts` — thêm `roleTrack` vào `TeamMemberInput`
- `apps/web-1/app/dashboard/team-fit/_components/TeamMemberCard.tsx` — ô select bắt buộc + sửa nhãn `major`
- `apps/web-1/app/dashboard/team-fit/_data/demo-preset.ts` — mọi preset member thiếu `roleTrack` → schema bắt buộc làm hỏng demo; map `major`→track cho từng member
- `apps/web-1/app/dashboard/team-fit/lib/validation.ts` — thêm nhãn `roleTrack` vào TEAM_LABELS (thiếu là draft cũ hiện lỗi tiếng Anh thô)

## Các bước

1. Schema: `roleTrack` là 1 trong 3 giá trị (Kỹ thuật / Marketing / Kinh doanh – Tài chính), bắt buộc với lượt mới.
2. UI: select bắt buộc trong thẻ thành viên. Nhãn ô `major` thành "Chuyên ngành đào tạo", ví dụ thành ngành thật ("Kỹ thuật phần mềm, Quản trị kinh doanh").
3. Ô lĩnh vực dự án giữ nguyên gõ tự do.
4. Mọi chỗ đọc `roleTrack` thiếu (dữ liệu cũ) → hiện "Chưa xác định", không đoán.

5. Demo presets: thêm `roleTrack` cho mọi member (map từ `major`).
6. Draft localStorage cũ: giữ nguyên, không xoá lén, không đoán track; thiếu thì bắt chọn lại lúc nộp (lỗi tiếng Việt nhờ bước trên).
## Test

- Mở rộng `team-fit-save.test.ts` (apps/api, node:test): lượt mới có trường mới lưu/đọc tròn; dữ liệu cũ thiếu trường vẫn lưu/đọc được.
- Phần hiển thị "Chưa xác định" kiểm tra bằng mắt ở phase 02.

## Xong khi

- [ ] Mỗi thành viên bắt buộc chọn mảng nghề; nhãn ô chuyên ngành đã sửa
- [ ] Case cũ thiếu trường xem được, không lỗi
