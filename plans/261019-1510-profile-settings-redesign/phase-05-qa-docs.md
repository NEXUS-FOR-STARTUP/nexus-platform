# Phase 5: QA, hồi quy vai trò khác, tài liệu

Priority: P2 · Status: Pending · Effort: 3h · blockedBy: Phase 2-4

## Context Links
- `reports/gap-register.md`, `../261019-1500-case-detail-redesign/reports/skill-filter-taste-minimalist.md`
- `research/scout-01` mục "Not checked"

## Key insights
- Web-1 không có test runner: cổng = `check-types`, `lint` (zero warnings), smoke trình duyệt, file assert nhỏ.
- Hồi quy vai trò khác là rủi ro chính (P-14): `ProfileInfoForm` + `SettingsLayout` dùng bởi admin/supporter/writer.
- Scout chưa đọc: 3 file wording, layout của 3 vai trò khác, mobile admin (chỉ-desktop nên không cần).

## Requirements
- Toàn bộ route sinh viên 1440/768/390 × sáng/tối; 3 route vai trò khác ở 1440.
- Bàn phím: Tab qua dải/sidebar → form; Enter gửi form; Esc đóng modal; focus trả về nút mở.
- Tài liệu: `design-system/wording/pages/settings-*.md` cập nhật chỉ khi chữ đổi (mặc định không đổi); `apps/web-1/AGENTS.md` (số hook, ghi chú tách hook) nếu số liệu đổi.

## Related code files
**Modify:** `apps/web-1/AGENTS.md` (nếu cần), `plans/261019-1510-profile-settings-redesign/plan.md` (status).
**Create:** `plans/261019-1510-profile-settings-redesign/reports/qa-final.md`.
**Delete:** không (mockup chờ duyệt).

## Implementation steps
1. `bun run check-types`, `bun run lint`: sửa mọi lỗi do plan này; lỗi cũ liệt kê.
2. Taste `lint.mjs` trên `app/dashboard/settings/`: 0 FAIL; giải thích từng WARN.
3. Ma trận smoke trong `qa-final.md`:
   | Route | 1440 sáng | 1440 tối | 768 | 390 | Ghi chú |
   |---|---|---|---|---|---|
   | /dashboard/settings/profile | | | | | dirty-gate, avatar lỗi |
   | /password | | | | | 2 chế độ |
   | /sessions | | | | | tải/lỗi/trống |
   | /notifications | | | | | rollback |
   | admin/settings/profile | | - | - | - | hồi quy |
   | supporter/settings/profile | | - | - | - | hồi quy |
   | writer/settings/profile | | - | - | - | hồi quy |
4. Grep nội dung trong `settings/`: `size="xs"` (không còn), `apiClient` (không), `try {` trong `.tsx` component (không), `as any` (không), hex (`#[0-9a-f]{3,6}` trong TSX: không), `CP[1-4]`.
5. `wc -l` mọi file sửa/tạo ≤200.
6. Danh sách còn lại báo chủ dự án: Q-P1 (4 nhóm thông báo cần backend), Q-P2 (địa điểm/last-seen cần backend), mockup 4 nhóm chưa làm.
7. Cập nhật status plan.

## Todo
- [ ] check-types, lint
- [ ] Taste lint
- [ ] Ma trận smoke
- [ ] Bàn phím
- [ ] Grep quy tắc
- [ ] `qa-final.md`

## Success criteria
- Không hồi quy ở 3 route vai trò khác.
- Mọi ô ma trận có bằng chứng hoặc ghi "chưa thấy được vì…".
- Lint/type sạch cho phạm vi sửa.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Không có tài khoản admin/supporter/writer dev | Ghi rõ chưa kiểm route đó; không báo đã kiểm |
| Phụ thuộc case plan P1 chưa merge | Dừng, không tự thêm token |

## Security
Rà lại: không log PII; thao tác phá hủy (xóa tài khoản, đăng xuất) chỉ trên DB dev + tài khoản thử.

## Next steps
Chủ dự án duyệt → xóa `design-system/mockups/settings-profile/`.
