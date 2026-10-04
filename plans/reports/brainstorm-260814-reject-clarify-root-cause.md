# Brainstorm — Case kẹt sau khi admin từ chối / yêu cầu làm rõ

Ngày: 2026-08-14 | Trạng thái: đang chốt dần | Chưa implement gì

## 1. Vấn đề gốc (1 câu)

Trạng thái hồ sơ bị ghi ở **2 đường song song** — một đường có kiểm soát (bộ quy trình machine), một đường ghi thẳng không kiểm soát — và **chưa có luồng nào được thiết kế trọn vẹn** cho vòng "admin hành động → sinh viên phản hồi → admin thấy lại".

`[đã kiểm chứng]` Bằng chứng: reject đi qua machine (reject-case.usecase.ts:23-29), request-info ghi thẳng (request-more-info.usecase.ts:37-44), sinh viên nộp lại ghi thẳng stage (submit-intake.usecase.ts:91-98).

**Bản chất: không phải lỗi thiết kế kiến trúc. Là code sai + code thiếu (bỏ dở việc nối code vào machine).** Machine đã định sẵn luật cho vòng từ chối → nộp lại từ trước (T12, T3, T4 đều có). Cái thiếu là nối code vào nó.

## 2. Hai nút admin — chốt: gộp còn 1 nút

### Nút "Từ chối" — giữ, là nút duy nhất

- Machine xử lý đúng: hồ sơ → "đã hủy" (kết thúc vòng hiện tại), sinh viên được báo. `[đã kiểm chứng]` case-machine.ts:81-84
- Nửa sau của vòng — **sinh viên sửa rồi nộp lại** — là chỗ hỏng hiện tại: nút "Chỉnh sửa hồ sơ" chỉ lưu nội dung, không đưa hồ sơ về hàng chờ → admin không thấy bản nộp lại. Đường nộp lại đúng chuẩn có sẵn (T3/T4) nhưng không màn hình nào gọi.
- Lỗi phụ: lý do từ chối admin gõ → sinh viên không thấy (chỗ ghi `T12_REJECT`, chỗ đọc `case_rejected`/`vetoed` — StatusGuidanceCard.tsx:36-42).

### Nút "Yêu cầu làm rõ" — xóa bỏ

**Quyết định (người dùng chốt): xóa nút này. Gộp vào "Từ chối".**

Lý do KISS: cả 2 nút cùng là một vòng lặp (admin viết lý do → sinh viên sửa → nộp lại → admin duyệt lại). Khác nhau chỉ ở chữ trên nút. Vì sau khi từ chối sinh viên luôn được nộp lại, "yêu cầu làm rõ" không mang thêm chức năng gì.

Hệ quả:
- Xóa endpoint admin request-more-info + use case ghi thẳng + nút FE. `[đã kiểm chứng]` admin.routes.ts:31, request-more-info.usecase.ts:37-44
- **Không cần thêm trạng thái machine mới** — ý tưởng "triage_waiting" trước đây bỏ.
- "Yêu cầu làm rõ" từ admin giờ = gõ lý do trong modal Từ chối. Lý do đó sẽ hiện cho sinh viên (sửa lỗi hiển thị, vốn đã nằm trong scope).

### "Từ chối hoàn toàn" — không build

**Quyết định (người dùng chốt): không có trạng thái "khoá vĩnh viễn".** Sinh viên luôn được nộp lại. Trường hợp thật sự muốn chặn → liên hệ ngoài hệ thống (gọi điện). Đúng YAGNI.

## 3. Bản đồ triệu chứng (tất cả = hệ quả của vấn đề gốc)

| Triệu chứng | Ở đâu | Xử lý |
|---|---|---|
| Nộp lại sau từ chối: kẹt, admin không thấy | submit-intake.usecase.ts:91-98 | nối vào machine (T3/T4) |
| Lý do từ chối không hiện | case-transition.service.ts:257 vs StatusGuidanceCard.tsx:36-42 | sửa khớp tên sự kiện |
| Yêu cầu làm rõ: kẹt, không gán được supporter | request-more-info.usecase.ts:37-44 | xóa luồng này |
| Nội dung yêu cầu làm rõ không hiện | page.tsx:127 | không còn áp dụng (luồng bị xóa) |
| Veto refund: chỉ hoàn tiền, credit không về 0 | case-transition.service.ts:146-153 | sửa: credit về 0 |
| Case hoàn thành vẫn cho nộp lại | case-machine.ts:181-195 | bỏ T3/T4 khỏi done (khoá hết) |
| Bản ghi tài liệu bị trùng (bug #12) | case.repository.ts:195-205 vs submit-intake.usecase.ts:51-61 | bỏ bản ghi trùng |
| Supporter giữa chừng yêu cầu bổ sung | supporter.routes.ts:15 | **giữ nguyên, luồng khác, không đụng** |

## 4. Quyết định đã chốt

1. Admin chỉ còn 1 nút "Từ chối". Không có "Yêu cầu làm rõ".
2. Sinh viên luôn được nộp lại sau khi bị từ chối. Không có khoá vĩnh viễn.
3. Veto (admin hủy trong 48h sau khi gán supporter): hoàn tiền + credit về 0. `[người dùng chốt]`
4. Case hoàn thành: khoá hết, không nộp lại. `[người dùng chốt]`
5. Supporter yêu cầu bổ sung giữa chừng: giữ nguyên như hiện tại.

## 5. Câu hỏi còn mở

1. Hiện tại có case đang kẹt ngoài đời — team gỡ tay bằng cách nào? (quyết định có cần bước dọn dữ liệu không)
2. "Chat ưu đãi thêm thời gian" — không tìm thấy trong code. Từng có thật hay chỉ là ý tưởng?
3. Sinh viên sửa hồ sơ + nộp lại: 1 nút (bấm lưu = nộp luôn) hay 2 bước (lưu nháp rồi nộp riêng)? Đề xuất 1 nút cho KISS — xác nhận?

## 6. Bước tiếp theo

Chốt 3 câu hỏi mở → viết plan chi tiết.

---

Nguồn tham chiếu: explorer-admin-reject-vs-request-info.md, debugger-plan-review-rca.md, researcher-credit-reject-verification.md (cùng thư mục `plans/reports/`).
