# Context: Free Tier (Gói 0) Template

## Trạng thái tài liệu

- Mục đích: Ghi lại vấn đề và context, KHÔNG chứa solution
- Ngày: 2026-07-20
- Nguồn duy nhất: `docs/nexus-document/cp3/feedback/01-cp3-mentor-template-guidance.md`
  - File đó là bản viết lại rõ ràng từ transcript của giảng viên về vấn đề này ở CP3

---

## Vấn đề

Sinh viên mới tiếp cận EXE101 bỡ ngỡ. Các khái niệm "solution", "pain point", "khách hàng mục tiêu" chưa hiểu. Không thể tự mô tả ý tưởng một cách có cấu trúc.

---

## Template điền ô trống

**a. Tạo một câu template (câu mẫu) có ô trống:**

Trong đó có những câu dẫn để định hướng cho sinh viên điền vào. Các ô trống gồm:

- Giai đoạn: ví dụ "checkpoint 1 EXE101"
- Lĩnh vực dự án hướng tới — hoặc idea dự kiến
- Mô tả chi tiết về idea: solution, MVP, giải quyết nhu cầu nào, cho nhóm khách hàng nào

Mục đích: giúp sinh viên phát biểu được:

- Ý tưởng phục vụ **ai** → khách hàng mục tiêu
- Phục vụ **nhu cầu gì**
- Bằng **cách nào** / bằng **sản phẩm gì**

> *"Các bạn nên có một cái câu template, các bạn nó chỉ điền vô những cái ô trống thôi."*
> *"Để làm rõ: khách hàng mục tiêu, pain point lựa chọn, solution nó là cái gì."*

**b. Sau đó, cho user khai tiếp thông tin đội ngũ:**

- Nhóm có bao nhiêu người
- Mỗi người: chuyên ngành đào tạo, sở trường, kinh nghiệm đặc biệt
- Tối đa 6 thành viên (theo format syllabus trường)

**c. Trả kết quả (phiên bản free):**

Sau khi user khai xong hết, hệ thống trả về đánh giá sơ bộ. Dạng đánh giá ví dụ:

> *"Với một đội ngũ thành viên với background như vậy, lĩnh vực các bạn dự kiến hình thành dự án khởi nghiệp — theo đánh giá sơ bộ ban đầu — là ổn."*

Có thể cụ thể hơn:

> *"Ổn về mặt thiết kế sản phẩm, về mặt thiết kế MVP. Nhưng về mảng mô hình kinh doanh tài chính thì còn yếu hoặc hoàn toàn thiếu."*

Đánh giá này dựa trên:

- Đội ngũ và các kỹ năng
- Những kỹ năng cần thiết cho một dự án khởi nghiệp trong lĩnh vực đó
- Tương quan: background thành viên, kinh nghiệm, sở trường → "được" hay "cần bổ sung"

---

## Mục đích tổng thể

Cung cấp một **bản cơ bản nhất** để người dùng (sinh viên mới) dùng định hướng idea và team. Không yêu cầu họ hiểu thuật ngữ chuyên ngành — chỉ cần điền vào ô trống theo câu dẫn.

---

## Codebase context (MVP hiện tại)

### Sản phẩm

Nexus Platform là web đóng gói dịch vụ audit và review cho sinh viên môn EXE101 (checkpoint 1). Sinh viên gửi tài liệu/idea, supporter phân tích và publish report. Hỗ trợ nhiều vòng sửa trong cùng một case.

### Stack

Turborepo monorepo: Next.js 16, Hono (API backend), Better Auth, Prisma 7, Mantine UI v9, TanStack Query/Form, Vercel AI SDK (OpenAI & Google), Lucide React.

### Cấu trúc

- `apps/api/` — Hono backend (auth, case management, payment, packages)
- `apps/web-1/` — Next.js frontend (landing, dashboard, admin, supporter)
- `prisma/` — Root Prisma schema (models: User, Case, Document, Payment, ServicePackage...)

### Flow hiện tại

```
Landing → Auth (email/Google) → Dashboard → Intake wizard (9 bước) → Submit case → Admin triage → Assign supporter → Review → Publish report → Revision rounds
```

### Landing page hiện tại

5 sections: Hero, FeaturesGrid, PackagePreview (hiển thị 4 gói dịch vụ), FAQ, ContactUs. Navigation có "Đăng nhập" và "Đăng ký". Không có CTA "Dùng thử miễn phí" riêng.

### Intake wizard (9 bước)

Sau khi đăng nhập, user tạo case qua wizard:
1. **Package** — chọn gói dịch vụ (radio button, gồm cả Gói 0)
2. **Situation** — mô tả vấn đề
3. **Contact** — thông tin liên hệ
4. **Project Context** — trường, môn, nhóm
5. **Support Needs** — nhu cầu hỗ trợ
6. **Documents** — upload Drive link
7. **Deadline** — hạn chót
8. **Boundary** — xác nhận ranh giới
9. **Review & Submit** — review trước khi gửi

### Package system

4 gói được seed vào DB khi chạy lần đầu:

| Tên | Giá | Features chính |
|-----|-----|----------------|
| Gói 0: Sàng lọc ý tưởng | 0₫ | AI phản biện tự động, báo cáo sơ bộ, phân tích phân khúc |
| Gói 1: Nhận xét 1 vòng | 99,000₫ | AI + 1 lần supporter review, SLA 48h |
| Gói 2: Nhận xét + Sửa đổi (2 vòng) | 199,000₫ | 2 vòng AI + supporter, chat, SLA 24h |
| Gói 3: Đồng hành nhiều vòng | 399,000₫ | Unlimited vòng, supporter riêng, SLA 12h |

Gói 0 và các gói trả phí đi chung một wizard, chung một case lifecycle. Không có flow riêng cho free.

### Case lifecycle state machine

```
submitted → triage_pending → accepted_unassigned → assigned → in_review → report_published → revision_*
```

Tất cả case đều qua admin triage (duyệt), không có đường tắt cho case miễn phí.

### Auth

Better Auth (email/password + Google OAuth). Tất cả API endpoint đều require session. Không có anonymous session.

### Payment

Case có `price > 0` mới yêu cầu payment proof upload. Gói 0 (price = 0) không cần payment. Payment use case reject `amount = 0` (coi là invalid).

### Admin panel

4 sections: Payments (duyệt thanh toán), Cases (triage + assign supporter), Documents (quản lý), Packages (cấu hình giá). Không có section cho free assessment riêng.

### Vai trò người dùng

- **User** — sinh viên gửi case, xem report
- **Admin** — triage case, assign supporter, quản lý
- **Supporter** — nhận case được assign, audit, publish report

---

## Gap giữa mentor muốn và codebase hiện tại

### Mentor muốn (từ CP3 + CP4)

| Khía cạnh | Mentor mô tả |
|-----------|-------------|
| Entry point | Free, không yêu cầu trả tiền hay đăng ký phức tạp |
| Form | Template điền ô trống có cấu trúc (câu dẫn + ô trống), không phải form tự do |
| Input fields | Giai đoạn, lĩnh vực, idea, solution, MVP, customer, team members (≤6) |
| Xử lý | Tự động, trả kết quả ngay |
| Output | Đánh giá sơ bộ: team background vs project fit, điểm mạnh/yếu |
| Upsell | Kết quả dẫn đến gói trả phí, không kết thúc ở free |

### Codebase hiện tại

| Khía cạnh | Thực tế |
|-----------|---------|
| Entry point | Bắt buộc auth (email/password hoặc Google) trước khi làm bất cứ gì |
| Form | Wizard 9 bước, field tự do (textarea, input), không có template cố định |
| Input fields | Nhiều hơn mentor yêu cầu: contact, trường, deadline, boundary confirmations... |
| Xử lý | Cần admin triage + supporter review, không có auto processing |
| Output | Supporter publish report thủ công, không có assessment tự động |
| Upsell | Không có — Gói 0 là dead-end, không có cơ chế chuyển lên gói trả phí |

### Tóm tắt gap

1. **Template form chưa có** — wizard hiện tại là free-form field, không phải câu template có ô trống
2. **Không có anonymous flow** — mọi thứ đều cần auth
3. **Không có tự động đánh giá** — free tier mentor muốn auto AI, hiện tại cần human supporter
4. **Không có upsell bridge** — Gói 0 không có đường dẫn sang paid
5. **Không có flow riêng** — Gói 0 và paid chung một đường
