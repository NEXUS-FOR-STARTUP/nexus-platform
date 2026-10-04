# PRD sản phẩm lõi

## 1. Thông tin tài liệu

- Sản phẩm: Nexus Platform
- Phiên bản: v1 MVP
- Trạng thái: đang làm việc
- Chủ sở hữu: Product / refactor docs

## 2. Tóm tắt sản phẩm

### Mục đích

Nexus là web đóng gói dịch vụ audit và review CP1 thành một flow rõ ràng để khách hàng biết case của mình đang yếu ở đâu, nên sửa gì trước, và có thể gửi bản sửa để được review lại trong cùng một lịch sử làm việc.

### Lý do business

- Giữ giá trị cốt lõi của Nexus là audit + review, không để trải nghiệm bị loãng thành upload file và theo dõi trạng thái.
- Biến quy trình thủ công hiện tại thành flow có thể demo, bàn giao, và lặp lại.
- Giữ đủ lịch sử tài liệu, vòng review, và feedback để supporter làm việc tốt hơn và Nexus tích lũy kinh nghiệm qua từng case.

### Người dùng mục tiêu

- Chính: đại diện team sinh viên cần được audit và review tài liệu/idea cho CP1.
- Phụ: admin triage và assign.
- Phụ: supporter xử lý case và publish report.

### Promise với khách hàng

Nexus giúp team:
- biết idea hoặc tài liệu đang yếu ở đâu;
- biết lỗi nào cần sửa trước;
- hiểu feedback giảng viên đang nhắm vào vấn đề gì;
- có hướng sửa cụ thể để team tự chỉnh;
- được review lại sau khi đã sửa.

## 3. Phạm vi

### Trong phạm vi

- landing và CTA bắt đầu
- đăng ký / đăng nhập
- create case wizard
- case submission
- admin triage accept/reject
- admin assign supporter
- user case workspace
- supporter audit workspace
- publish report vào case
- revision round trong cùng case
- document board và timeline tối thiểu
- lịch sử report theo round

### Ngoài phạm vi

- chat realtime đầy đủ
- AI tự trị end-to-end
- public knowledge base lớn
- analytics nâng cao
- workflow cho nhiều checkpoint ngoài CP1 làm source of truth hiện tại
- payment workflow bắt buộc trong vòng demo hiện tại nếu chưa cần

### Định nghĩa MVP

MVP đạt khi có thể demo trọn câu chuyện sau:

1. người dùng vào landing
2. người dùng đăng ký tài khoản
3. người dùng tạo case qua wizard
4. admin nhận case, accept/reject, assign supporter
5. supporter mở case, audit, publish report
6. người dùng xem report trong case workspace
7. người dùng gửi bản sửa mới
8. supporter review round tiếp theo trong cùng case

## 4. Tín hiệu thành công

- Người dùng hiểu Nexus giúp gì ngay từ landing.
- Create case flow không làm user bị ngợp như một form hành chính.
- Admin triage được case mới từ một queue rõ ràng.
- Supporter có đủ ngữ cảnh để xử lý mà không cần lục nhiều kênh ngoài hệ thống.
- Report là phần nổi bật nhất trong user workspace.
- Revision không tạo thành các case rời rạc.
- Hệ thống giữ được lịch sử version / round / artifact để supporter tra cứu về sau.

## 5. Danh sách tính năng

| Feature ID | Tên tính năng | Ưu tiên | Vì sao tồn tại | Người dùng mục tiêu | Vấn đề giải quyết | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | Public entry, auth, and case submission | Must | Biến nhu cầu hỗ trợ thành case gửi được | User | Không biết bắt đầu, thông tin rời rạc | Đang làm việc |
| F02 | User case workspace and document board | Must | Cho user một nơi xem report, tài liệu, và next action | User | Không biết case đang ở đâu và phải làm gì tiếp | Đang làm việc |
| F03 | Admin triage and assignment | Must | Có bước nhận/reject/assign rõ ràng | Admin | Case mới không có người giữ bóng | Đang làm việc |
| F04 | Supporter audit workspace and report publishing | Must | Giữ chất lượng xử lý và output | Supporter, user | Không thể audit nhất quán nếu thiếu ngữ cảnh và lịch sử | Đang làm việc |
| F05 | Revision rounds and history | Must | Hỗ trợ nhiều vòng trong cùng case | User, supporter | Bản sửa bị tách rời khỏi ngữ cảnh cũ | Đang làm việc |
| F06 | Roles and access boundary | Must | Tách rõ public, user-private, internal, restricted | Tất cả role | Lộ dữ liệu và lộ logic vận hành | Đang làm việc |
| F07 | Admin packages pricing configuration | Must | Cho phép Admin cập nhật giá tiền động của các gói dịch vụ | Admin | Cấu hình giá gói dịch vụ cứng không linh hoạt | Đã hoàn thành |

## 6. Screen inventory MVP

- Landing
- Register / Login
- Empty dashboard
- Create case wizard
- Review before submit
- Case submitted success
- User case workspace
- Admin triage queue
- Admin case detail
- Supporter queue
- Supporter case detail / audit workspace
- Submit revision modal/page
- Admin Packages Settings panel (bảng cấu hình giá các gói dịch vụ)

## 7. Business rules liên quan nhiều feature

- Không tạo case mù khi chưa đủ thông tin tối thiểu.
- Intake phải có cấu trúc dù UX có thể mang cảm giác hội thoại.
- User-facing value phải là audit + review, không phải quản lý hồ sơ.
- Report must publish vào case workspace.
- Một case có nhiều round, không tạo case mới cho mỗi vòng sửa.
- Một feedback mới không tự động đồng nghĩa với version tài liệu mới.
- Output quan trọng phải có người chịu trách nhiệm.
- User luôn phải thấy next action.
- Public copy không dùng wording hứa hẹn qua môn hay điểm số.

## 8. Quyết định khóa cho phase 1

- Admin triage: accept/reject (lý do từ chối ≥ 10 ký tự) / assign supporter. `Yêu cầu bổ sung` của admin đã xóa (2026-08-14, F03) — kênh triage giờ là reject reason; yêu cầu bổ sung do supporter thực hiện (machine T8) sau khi được assign.
- Report phase 1 là structured rich text trong hệ thống và có thể kèm file đính kèm.
- Realtime chat đã ship 2026-08-08 (Centrifugo v6, WS primary + REST 60s fallback) — dòng "không làm in-app chat" là quyết định phase-1 gốc, đã được thay thế.
- Payment không nằm trong luồng bắt buộc của demo round đầu, nhưng tính năng cấu hình giá gói dịch vụ (Packages Pricing Configuration) dành cho Admin đã được hiện thực hóa đầy đủ ở admin console, cùng với cơ chế khóa giá (Price Locking) và lưu vết thay đổi (Pricing Change Audit Trail).

## 9. Thiếu / chưa rõ

- Chưa khóa danh sách file type hỗ trợ ở phase 1.
- Chưa khóa closed reasons taxonomy.
- Chưa khóa rule ưu tiên case chi tiết theo deadline / urgency.
