# QA cuối (2026-10-19)

## Đã chạy
- `bun run check-types` (web-1): pass sau thay đổi StatusChip và grading-state.
- ESLint trên toàn bộ file đã đổi/mới: pass; CSS module `status-chip.module.css` dùng cho sentence-case chip.
- Pure checks bằng script tạm, sau đó xóa script: `formatVndAmount` 6 ca; `parseStageView`; credit filter/count; day grouping (ranh giới 00:00 giờ Việt Nam); document grouping/version; result-run ownership/order; `countMissingProfileFields`; `describeGradingState` đủ 5 trạng thái: pass.
- Browser authenticated read-only QA với case TIBOO, session cookie từ người dùng:
  - 1440px: overview, journey, draft, files, results, billing, timeline, settings.
  - 768px: draft và timeline, không có horizontal overflow.
  - 390px: overview, draft, results, billing, không có horizontal overflow.
  - Dark theme: overview mobile và grading modal desktop render được.
  - Drawer mobile: mở và đóng bằng Escape.
  - PDF result: iframe hiển thị báo cáo thật.
  - Upload `.exe`: bị chặn client-side, không phát sinh request ghi.
  - Credit history: chỉ gọi `GET /api/orders/:id` sau khi mở dòng, response 200.
  - Grading confirm modal: mở bước 1/2 và hủy, không submit.

## Chưa chạy / chưa được phép
- Không submit upload hợp lệ, không chấm bài, không mua lượt, không xóa dữ liệu: đây là dữ liệu thật.
- Chưa kiểm mọi tab ở mọi tổ hợp viewport/theme; 768 chỉ kiểm draft/timeline, dark chỉ kiểm hai màn.
- Console scan tự động không có kết quả đáng tin cậy: browser helper trả về kiểu không lọc được ở lần đọc console; không tuyên bố console sạch.
- `inspect.mjs` không chạy vì trang yêu cầu authentication.

## Ghi chú
- Next dev indicator che một phần FAB góc dưới trái trong môi trường dev; không phải UI sản phẩm.
- Dữ liệu câu trả lời có chuỗi thử nghiệm cũ trong case TIBOO; QA không sửa.
- Gaps C-37 đến C-39 ở `gap-register.md` vẫn mở.
