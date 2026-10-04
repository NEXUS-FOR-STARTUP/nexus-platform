# Project Context

## 1. Tóm tắt dự án

- Tên dự án: Nexus Platform
- Mô tả một dòng: web đóng gói dịch vụ audit và review tài liệu/ý tưởng để giúp nhóm sinh viên tăng khả năng pass CP1 theo hướng có cấu trúc, nhiều vòng, và có truy vết.
- Giai đoạn hiện tại: chốt MVP cho flow audit CP1 end-to-end (v1.0.0 đã release).
- Trạng thái tài liệu: đang làm việc
- Research đã thực hiện: logging best practices (Pino + SigNoz/Loki) — xem `plans/reports/research-logging-best-practices-2026.md`

## 2. Bối cảnh business

### Giá trị cốt lõi cho khách hàng

Nexus không bán một `case management system`.

Nexus bán khả năng:
- nhìn ra lỗi gốc của idea hoặc tài liệu;
- biết nên sửa phần nào trước;
- hiểu feedback giảng viên đang nhắm vào đâu;
- nhận hướng sửa đủ rõ để team tự chỉnh;
- được review lại sau khi team sửa.

Mục tiêu thực tế là tăng xác suất team đi đúng hướng và tăng khả năng pass CP1, không phải tạo một portal quản lý hồ sơ đẹp mắt.

### Lớp vận hành nội bộ

Case management, document lifecycle, assignment, history, và feedback loop chỉ là lớp hạ tầng để Nexus vận hành nhất quán hơn qua nhiều case.

Lớp này tồn tại để:
- không làm mất bối cảnh case;
- không thất lạc tài liệu hoặc report;
- theo dõi được nhiều vòng sửa;
- giữ lịch sử để supporter và Nexus học qua từng case.

### Vấn đề business đang giải quyết

- Team không biết idea hoặc tài liệu đang yếu ở đâu.
- Team không biết lỗi nào cần sửa trước.
- Team không chắc feedback giảng viên đang nhắm vào vấn đề gốc nào.
- Team sửa xong vẫn không chắc bản mới đã ổn hơn chưa.
- Quy trình hỗ trợ thủ công qua form, Drive, sheet, chat làm supporter mất công và khó giữ lịch sử rõ ràng.

## 3. Khách hàng mục tiêu

### Beachhead customer

- Nhóm sinh viên FPT làm bài ở giai đoạn tương đương `EXE101 / Checkpoint 1`.
- Đây là source of truth cho logic sản phẩm, dù public copy không cần lộ trực diện tên môn hay checkpoint.

### Tình huống khách hàng chính

- Chưa có idea và cần tìm hướng.
- Có nhiều idea và cần chọn một hướng.
- Có một idea và muốn kiểm tra nó có rõ, thực tế, khả thi không.
- Đã có tài liệu và muốn được audit trước khi nộp.
- Đã nhận feedback và cần hiểu nên sửa gì trước.
- Đang gấp hoặc đã fail mốc gần nhất và cần hỗ trợ sát deadline.

### Người trực tiếp dùng hệ thống

- Leader
- Project Manager
- Business Analyst / người phụ trách idea
- người phụ trách tài liệu

### Người dùng nội bộ

- Admin: triage case, accept/reject, assign supporter.
- Supporter: audit case, yêu cầu bổ sung, tạo report, review lại ở các vòng sau.

## 4. Định hướng sản phẩm

### Sản phẩm là gì

Nexus là web workflow để đóng gói dịch vụ audit/review CP1 thành một hành trình rõ ràng:
- khách gửi case;
- Nexus nhận và phân loại;
- supporter audit;
- khách nhận report;
- khách gửi bản sửa;
- supporter review vòng tiếp theo.

### Sản phẩm không phải là gì

- Không phải AI-only product.
- Không phải chat app để nói chuyện tự do, dù chat text là một core coordination surface trong MVP.
- Không phải portal lưu file thông thường.
- Không phải hệ thống làm bài hộ.
- Không phải hệ thống cam kết điểm số.

### Mục tiêu MVP

- Biến quy trình manual hiện tại thành flow web đủ rõ để demo.
- Giữ value chính là audit + review, không để UI trôi thành quản lý hồ sơ thuần túy.
- Mã hóa được triage, assignment, report publishing, revision rounds, và document history.

## 5. Core Value Flow Cho Khách Hàng

1. Khách nhận ra team đang kẹt.
2. Khách được dẫn để mô tả case đủ rõ.
3. Khách gửi case với kỳ vọng đúng.
4. Khách biết case đã được nhận và đang được xem xét.
5. Khách nhận report đầu tiên và hiểu nên sửa gì trước.
6. Khách tự sửa tài liệu trong team.
7. Khách gửi bản sửa mới trong cùng case.
8. Khách nhận review vòng tiếp theo.
9. Khách kết thúc với hướng đi rõ hơn và xác suất pass cao hơn.

## 6. Ops Flow Nội Bộ

1. Nhận case mới.
2. Triage case.
3. Accept hoặc reject.
4. Assign supporter.
5. Supporter kiểm tra input.
6. Yêu cầu bổ sung nếu thiếu.
7. Audit và tạo report.
8. Publish report vào case.
9. Theo dõi revision round.
10. Tích lũy knowledge cho supporter và hệ thống.

## 7. Document Lifecycle Model Nội Bộ

Web nên bám logic nghiệp vụ xác nhận từ quy trình Drive hiện tại:

`case -> checkpoint -> version -> assessment -> artifact`

Giải thích ngắn:
- `case`: hồ sơ hỗ trợ độc lập cho một team.
- `checkpoint`: mốc như `cp1`, `cp2`.
- `version`: bản tài liệu nhóm gửi hoặc bản Nexus xử lý trên một version cụ thể.
- `assessment`: vòng đánh giá / phản hồi dựa trên một version.
- `artifact`: file hoặc tài liệu cụ thể, thuộc `input`, `output`, hoặc `evidence`.

User không cần thấy naming kỹ thuật như `v01`, `a01-v01`. Nhưng hệ thống nội bộ nên giữ logic đó để không mất lịch sử.

## 8. Ràng buộc

### Ràng buộc định vị

- Public-facing copy phải nói theo ngôn ngữ giá trị: `làm rõ ý tưởng`, `nhận phản hồi có cấu trúc`, `biết sửa gì trước`.
- Không đẩy `case management` lên thành headline value.

### Ràng buộc đạo đức và học thuật

- Không viết thay bài làm.
- Không chọn idea thay team.
- Không cam kết chắc chắn điểm số.
- Team vẫn tự chịu trách nhiệm với tài liệu và quyết định cuối cùng.

### Ràng buộc UX

- User-facing screens phải xoay quanh report, hướng sửa, next action.
- File list và timeline chỉ là lớp hỗ trợ.
- Report phải sống trong case workspace, không phát tán bằng chat làm source of truth.

### Ràng buộc kỹ thuật

- Auth/session ở `apps/api`.
- Một root `.env`.
- Prisma schema snake_case/plural.

## 9. Giả định

- Một case thường gắn với một team hoặc một người đại diện team.
- Một case có thể có nhiều round review.
- Một bản sửa mới của nhóm tạo ra version mới.
- Một feedback hoặc report mới trên cùng version không nhất thiết tạo version mới.
- Admin là vai trò nhận/reject/assign trước khi supporter bắt đầu xử lý.

## 10. Rủi ro đã biết

- Nếu UI nhấn quá mạnh vào upload file và status, Nexus sẽ trông như portal quản lý hồ sơ.
- Nếu không encode được revision rounds và document history, supporter sẽ mất ngữ cảnh qua từng vòng.
- Nếu public copy quá chung chung, khách không hiểu Nexus giúp gì.
- Nếu public copy quá cụ thể, có rủi ro lộ ngữ cảnh syllabus không mong muốn.

## 11. Quyết định khóa cho phase 1

- Report phase 1 dùng dạng hỗn hợp:
  - phần chính là structured rich text để user đọc trực tiếp trong case workspace;
  - supporter có thể đính kèm file report nếu cần tải xuống hoặc in ra.
- Giữ tab chat text đơn giản trong case như một coordination surface cốt lõi. **Superseded (2026-08-08):** chat realtime đã ship sau phase 1 qua Centrifugo v6 — WebSocket primary + REST polling 60s fallback (xem `docs/realtime-centrifugo-guide.md`); client không publish trực tiếp, tin qua REST để giữ credit check + stage lock + access control.
- Payment/credit là core economy đã code: hệ thống credit ledger (purchase/consumption/refund với `balance_after`), sepay webhook xác minh bank transfer, admin veto-with-refund (48h), giá 39,000 VND/credit, error `NO_CREDITS` (402). Không còn là thứ "có thể tạm ẩn" — nó là luồng thanh toán chính của MVP hiện tại. Ngoài ra, khả năng cấu hình giá các gói dịch vụ (Packages Pricing Configuration) dành cho Admin đã được tích hợp, đi kèm với cơ chế **Price Locking** (snapshot `locked_price` khi tạo case) và **Pricing Change Audit Trail** (lưu vết `previous_price`, `last_price_changed_at`, `last_price_changed_by` trên `ServicePackage`) để bảo vệ dữ liệu lịch sử. Logic giá và kiểm thử minh chứng thanh toán được tập trung qua các helper như `getCaseEffectivePrice` và `validatePaymentProof` trong `@/lib/pricing.ts`.
- Admin triage: accept/reject (lý do từ chối ≥ 10 ký tự) / assign supporter. `Yêu cầu bổ sung` của admin đã xóa (2026-08-14) — kênh triage giờ là reject reason; yêu cầu bổ sung do supporter thực hiện (machine T8) sau khi được assign.

## 12. Liên kết source of truth

- PRD: [`prd/core-product-prd.md`](./prd/core-product-prd.md)
- Flows: [`flows/`](./flows/)
- Requirements: [`requirements/`](./requirements/)
- Technical notes: [`technical-notes/`](./technical-notes/)
- Archive: [`archive/`](./archive/)
