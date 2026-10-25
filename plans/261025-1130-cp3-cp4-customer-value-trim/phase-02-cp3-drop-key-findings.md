# Phase 2: CP3 bỏ `cp3_key_findings` và check `c3_findings_grounded`

## Mục tiêu
Bỏ câu "Phát hiện chính của nhóm là gì?" (hint tự nói "mọi ý lấy lại từ BMC/SWOT, không thêm ý mới") và check chấm nó. CP3 còn 19 câu, 22 check. Giữ `cp3_business_feasibility` và `cp3_future_development`.

## Điểm chạm (đã grep, bỏ qua `docs/` và plan cũ)
| File | Việc |
|---|---|
| `packages/validation/src/catalogs/cp3.ts:60` | bỏ dòng `cp3_key_findings` khỏi phase Kết luận |
| `packages/validation/src/catalogs/questions-cp3.ts:233-245` | bỏ định nghĩa câu |
| `packages/validation/src/catalogs/cp3-audit-checks.ts:41` | bỏ `c3_findings_grounded` (nhóm `conclusion` còn 2 check; trọng số nhóm giữ 10) |
| `data/system-prompts/cp3_full_review_v1.md:94` | bỏ hàng bảng tiêu chí `c3_findings_grounded` |
| `data/system-prompts/cp3_audit_core_v1.md:39` | bỏ câu nhắc `cp3_key_findings` trong quy tắc 1; giữ ý "không chấm sản phẩm thử" |
| `packages/validation/src/catalogs/index.ts` | bump `CATALOG_VERSION` ("2026-10-25.1" → ".2") |
| `packages/validation/src/__tests__/cp3-audit.test.ts:66` | đang ghim `CP3_GRADED_QUESTION_IDS.length === 20`: đổi thành 19. Test "id khớp bảng prompt" phải xanh. Kiểm thêm test catalog/stage-summaries và `cp3-audit-quotes.test.ts` |

## Bước
1. Sửa các file trên (theo bảng). Đếm lại: câu CP3 = 19, check = 22.
2. Kiểm trước khi bỏ: `grep` còn tham chiếu `key_findings|findings_grounded` ngoài `docs/` và `plans/` (kể cả `apps/api/src`, `apps/web-1`, worker). Đã grep: không có ngoài danh sách trên.
3. `countAnswersByStage` (`apps/api/src/modules/cases/application/derive-stage-summaries.ts:40-48`): hiện đếm mọi `cp3_*` không rỗng, nên câu `cp3_key_findings` còn trong DB làm "đã trả lời" lớn hơn tổng. Thêm điều kiện bỏ qua `question_id` không thuộc `QUESTION_REGISTRY`. Giữ nguyên điều kiện self-check hiện có.
4. Test hồi quy cho bước 3: một dãy answers có `cp3_key_findings` không rỗng + 2 câu cp3 hợp lệ → đếm CP3 = 2.
5. Báo cáo đã lưu (CP3 audit cũ có `c3_findings_grounded`): `scoreCp2Report` đã bỏ qua id không có trong catalog (`if (!meta ...) continue`, `cp2-audit-score.ts:39-40`): điểm an toàn, không cần sửa. Hiển thị chưa kiểm: đọc `cp3-report-display.ts` và `cp2-report-display.ts`, chạy với fixture có id cũ; nếu tra `CP3_FULL_CHECKS[id].label` sẽ ném lỗi hoặc hiện trống thì lọc id lạ khi hiển thị, kèm test.
6. Prod, trước khi deploy (SELECT bằng guest, `docs/db-query-guide.md`): đếm `project_answers where question_id='cp3_key_findings'` và báo cáo CP3 đã có. Báo cáo kết quả cho user; không sửa dữ liệu.
7. Đảo một phần quyết định `ad8ca0e` ("chấm cả 20 câu" → 19): ghi vào CHANGELOG.
8. Prompt chấm đọc từ `data/system-prompts/` lúc chạy: kiểm cách worker/API nạp prompt (volume hay image) trong `docs/vps-deployment-guide.md`, để deploy cập nhật cả prompt lẫn code; nếu prompt cũ còn bảng có `c3_findings_grounded` mà catalog đã bỏ, model sẽ trả check lạ (bị bỏ qua khi chấm điểm nhưng vẫn có thể lọt vào báo cáo). Ghi vào checklist deploy.

## Test
- `cd packages/validation && bun run build && bun run test`.
- API từng file: `cp3-audit-quotes.test.ts`, test stage-summaries, test mới ở bước 4.
- `npx tsc --noEmit` ở validation, api.

## Tiêu chí xong
- Không còn `cp3_key_findings` / `c3_findings_grounded` ngoài `docs/`, `plans/`, `reports/`.
- Test validation + api liên quan xanh.
- Fixture báo cáo cũ không làm hỏng điểm hoặc hiển thị.
