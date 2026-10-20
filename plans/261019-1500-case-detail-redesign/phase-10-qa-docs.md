# Phase 10: QA, a11y, tài liệu

Priority: P2 · Status: Pending · Effort: 4h · blockedBy: Phase 2-9

## Context Links
- `reports/skill-filter-taste-minimalist.md` (cổng kiểm)
- `design-system/mockups/case-detail/REPORT.md` §11 (quy tắc implement), §9 (chưa kiểm tra)
- `research/scout-03` §6 (cổng kiểm: check-types + lint + smoke, không có test runner)

## Key insights
- Web-1 không có `vitest`/`playwright`. Cổng = `bun run check-types`, `bun run lint` (zero warnings), smoke trình duyệt, cộng các file assert nhỏ đã viết trong phase.
- `inspect.mjs` của taste skill không vào được trang cần đăng nhập; dùng `browser` thủ công, nói rõ trong báo cáo.
- REPORT mockup §9 liệt kê chưa kiểm: ngưỡng 768px của hai hộp thoại, giới hạn 25MB, bảng chi tiết giao dịch <390px, chế độ tối. Phải xử lý ở đây.

## Requirements
- Smoke đủ 1440/768/390 × sáng/tối × mọi tab.
- A11y: điều hướng bàn phím toàn bộ; `aria-*` còn đủ; tương phản chip.
- Tài liệu: cập nhật `apps/web-1/AGENTS.md` mục case workspace (hiện ghi 7 tab, sai so với 5 tab đang chạy); ghi `design-system/mockups/case-detail/REPORT.md` đã triển khai.
- Dọn: xóa file/code thừa do phase để lại; không để `TODO`.

## Related code files
**Modify:** `apps/web-1/AGENTS.md`, `AGENTS.md` (nếu số liệu đổi), `plans/261019-1500-case-detail-redesign/plan.md` (status), `design-system/wording/pages/case-detail.md` (nếu đổi chữ).
**Create:** `plans/261019-1500-case-detail-redesign/reports/qa-final.md`.
**Delete:** mockup chưa xóa (chờ chủ dự án duyệt, REPORT §10 nói xóa khi duyệt xong).

## Implementation steps
1. Chạy `bun run check-types`, `bun run lint`: sửa mọi lỗi/cảnh báo do phase này gây ra; lỗi cũ không thuộc phạm vi → liệt kê.
2. Chạy toàn bộ file test nhỏ (formatVndAmount, parseStageView, document-groups, result-runs, describeGradingState, credit-history-filter, activity-groups, countMissingProfileFields). Ghi lệnh và kết quả vào `qa-final.md`.
3. Taste `lint.mjs` trên các thư mục đã sửa: 0 FAIL; từng WARN có lý do (viền Paper, font, nhãn phiên bản).
4. Smoke ma trận (bảng trong `qa-final.md`):
   | Tab/view | 1440 sáng | 1440 tối | 768 | 390 | Ghi chú |
   |---|---|---|---|---|---|
   | overview (4 ca) | | | | | |
   | journey list | | | | | |
   | stage draft | | | | | 6 trạng thái TOC |
   | stage files | | | | | trống/có |
   | stage results | | | | | mobile không iframe |
   | grading panel | | | | | trạng thái nào thấy được |
   | audit modal | | | | | CP1 & CP2 |
   | upload modal | | | | | |
   | billing | | | | | mở rộng + lazy đơn |
   | timeline | | | | | |
   | settings | | | | | dirty-gate |
5. Bàn phím: Tab qua sidebar → nội dung; mũi tên trong Tabs; Esc đóng Drawer/Modal; focus trả về nút mở; hàng mở rộng Enter/Space.
6. Tương phản: kiểm `StatusChip` 5 tone ở chế độ tối bằng mắt/công cụ; sửa nếu <4.5:1 (đổi `color` Mantine, không hex).
7. Quy tắc nội dung: grep `CP[1-4]`, `cp[1-4]_`, `đ\b`, `₫`, `\d\.\d{3} VND`, `credit`, `uppercase`, `apiClient` trong thư mục đã sửa; mọi hit phải là mã nội bộ/comment/hợp lệ.
8. Kích thước file: mọi file đã sửa/tạo ≤200 dòng (`wc -l`).
9. Cập nhật `AGENTS.md` web-1 (số tab, token `--ui-*`, `UnderlineTabs`/`StatusChip`/`ExpandableList`/`CopyIconButton`/`formatVndAmount`).
10. Báo chủ dự án: danh sách Q chưa trả lời + quyết định mặc định đã dùng + việc để lại (Q6, Q8, Q9).

## Todo
- [ ] check-types, lint
- [ ] Chạy test nhỏ
- [ ] Taste lint
- [ ] Ma trận smoke
- [ ] Bàn phím + tương phản
- [ ] Grep quy tắc nội dung
- [ ] Cập nhật AGENTS.md
- [ ] `qa-final.md`

## Success criteria
- `check-types` + `lint` sạch (hoặc lỗi cũ liệt kê riêng, không do phase này).
- Mọi ô ma trận có ảnh/kết quả hoặc ghi rõ "chưa thấy được vì…".
- Không còn hit vi phạm quy tắc nội dung chưa giải thích.
- Docs khớp thực tế.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Thiếu dữ liệu để thấy trạng thái chấm lỗi/dừng | Ghi rõ chưa thấy; không báo đã kiểm |
| Lint cũ ngoài phạm vi làm đỏ CI | Tách danh sách, không sửa lan |
| Quên xóa code thừa | Bước 7-8 bắt buộc |

## Security
Rà lại: không log PII/mã giao dịch; không hardcode URL/secret; link ngoài `rel` đúng.

## Next steps
Chủ dự án duyệt → xóa `design-system/mockups/case-detail/` (hoặc chuyển thành tài liệu); cân nhắc plan dọn code chết (Q6).
