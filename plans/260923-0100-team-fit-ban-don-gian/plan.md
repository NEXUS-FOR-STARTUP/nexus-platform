# Nâng cấp đơn giản bản free team-fit

> Trạng thái: chờ duyệt. Ngày: 2026-09-23.
> Thay cho `plans/260923-0037-team-fit-free-value-redesign/` (bản cũ đòi soạn tiêu chí từng ngành, không có người làm).
> Gộp cả việc vào plan vì nhỏ (3 phase). Chi tiết nằm ở phase file.

## 1. Vì sao bản cũ không làm được

Bản cũ đòi viết tiêu chí riêng cho từng ngành rồi duyệt — cần người hiểu nghề, không có nên tắc. Bản này bỏ hẳn phần soạn sẵn: những gì cần biết về ngành, AI tự suy ra lúc chạy từ ô lĩnh vực khách đã gõ. 0 bảng mới, 0 file dữ liệu mới.

## 2. Giữ / bỏ

Giữ: kết luận sơ bộ + mảng ổn/yếu (mentor yêu cầu); đối chiếu ngành do AI tự suy lúc chạy; dẫn chứng gắn từng nhận định; máy tự đếm 4 chỉ số; phần cầu dẫn cố định; bỏ kết luận AI khỏi file audit 79k; giới hạn lượt theo mẫu có sẵn.

Bỏ: 3 bảng DB + file JSON + sửa `generate_db.ts`; ô `fieldCategory` cố định; soạn câu hỏi phản biện từng ngành.

## 3. Báo cáo mới: 3 phần

A — máy đếm ("Đã kiểm tra"): mấy ngành đào tạo, phủ 3 mảng nghề, kinh nghiệm, ô trống. B — AI chấm ("AI nhận định"): kết luận + ổn/yếu có dẫn chứng + vai trò thiếu + câu hỏi hội đồng. C — cầu dẫn cố định 4 câu, luôn hiện kể cả khi AI lỗi.

## 4. Phase

| Phase | Nội dung | Trạng thái |
|---|---|---|
| [phase-01](phase-01-input-fields.md) | Ô chọn mảng nghề + sửa nhãn | Xong |
| [phase-02](phase-02-report-structure.md) | Prompt mới + dạng báo cáo + sửa chỗ đọc cũ | Xong |
| [phase-03](phase-03-handoff-and-limit.md) | Bỏ kết luận AI khỏi file audit + giới hạn lượt | Xong |

## 5. Chỗ dễ sai

Đổi dạng mà quên chỗ đọc cũ là 2 danh sách hiện trống trơn không báo lỗi (8 file, liệt kê ở phase-02). Giữ cách gọi hiện tại: 1 lần AI rồi trả ngay, không qua worker bản trả tiền. Không nối vào `TeamFitReportSchema` (chứa `recommendations`). Dữ liệu cũ thiếu trường hiện "Chưa xác định".

## 6. Xong khi nào
- [x] Báo cáo đủ 3 phần, nhãn tách rõ; kết luận + ổn/yếu có dẫn chứng
- [x] AI suy yêu cầu ngành từ ô lĩnh vực, không tra bảng; cầu dẫn đủ 4 câu
- [x] File audit 79k không còn mục kết quả AI bản free
- [x] Test: máy đếm đúng (ngành/mảng/kinh nghiệm/ô trống); lưu-đọc tròn dạng mới; lượt N+1 bị chặn, xem lại không tính lượt
- [x] Case cũ xem được; rà mắt 1 case thật qua 8 chỗ đọc; `check-types` sạch
- [x] Cập nhật `docs/flows/team-fit-flow.md` theo báo cáo mới (3 phần, giới hạn lượt, bàn giao audit)
