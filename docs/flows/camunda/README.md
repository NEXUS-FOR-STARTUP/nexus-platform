# Bộ mô hình BPMN + DMN (Camunda 8)

Thư mục này chứa bộ mô hình chuẩn OMG cho 5 flow nghiệp vụ đã viết ở `docs/flows/*.md`:

| File | Process/Decision | Tương ứng flow markdown |
|---|---|---|
| `intake.bpmn` | `intake-process` — Nhập hồ sơ | `../intake-flow.md` |
| `payment-and-credit.bpmn` | `payment-and-credit` — Nạp ví & mua lượt | `../payment-verification-flow.md` |
| `admin-triage.bpmn` | `admin-triage` — Xét duyệt & phân công | `../admin-triage-and-assignment-flow.md` |
| `case-lifecycle.bpmn` | `case-lifecycle` — Vòng đời case | `../case-lifecycle-flow.md` |
| `team-fit.bpmn` | `team-fit` — Kiểm tra khớp nhóm | `../team-fit-flow.md` |
| `approve-eligibility.dmn` | Quyết định "Case có thể duyệt?" | gate thanh toán trong triage |
| `veto-eligibility.dmn` | Quyết định "Veto có hợp lệ?" | cửa sổ 48h trong triage |
| `refund-on-terminal.dmn` | Quyết định "Hoàn tiền khi đóng case" | từ chối / veto / hủy / xóa |

## Vai trò

- **BPMN** mô tả quy trình: ai làm gì, theo thứ tự nào, rẽ nhánh ở đâu.
- **DMN** tách phần quyết định (if/then) ra bảng độc lập — đổi chính sách = sửa bảng, không phải vẽ lại sơ đồ.
- Business rule task trong BPMN trỏ vào DMN bằng `zeebe:calledDecision`:
  - `admin-triage.bpmn` → `approve_eligibility`, `veto_eligibility`, `refund_on_terminal`.

## Giao tiếp giữa các process (message)

| Message | Ném từ | Bắt ở |
|---|---|---|
| `case-created` | `team-fit` (2 end event) | `intake` (message start) |
| `case-submitted` | `intake` (end event) | `admin-triage` (message start) |
| `case-paid` | `intake` (end event) | (admin poll — xem ghi chú) |
| `case-assigned` | `admin-triage` (end event) | `case-lifecycle` (message start) |
| `case-reopened` | `payment-and-credit` (end event) | `case-lifecycle` (message start) |
| `case-updated` | (admin poll thay vì message) | `admin-triage` (intermediate catch) |
| `bank-deposit-received` | SePay webhook | `payment-and-credit` (catch) |
| `admin-verified-deposit` | admin xác nhận nạp tiền | `payment-and-credit` (catch) |

Correlation key = `caseId` (hoặc `depositCode` cho nạp tiền).

## Ghi chú trung thực với codebase hiện tại

1. **Đây là file mô tả luồng nghiệp vụ, chưa có engine chạy.** API hiện tại (Hono + XState trong `apps/api`) không deploy các file này; message ở trên là mô hình hóa khái niệm — trong code, trigger thực tế là gọi REST + polling 10s (`refetchInterval` ở web-1), không phải publish message.
2. **`zeebe:taskDefinition` type chỉ là tên nghiệp vụ** (`accept-case`, `submit-output`, `publish-message`…). Trong code, hành vi tương ứng nằm ở các usecase + `case-transition.service.ts`; nếu sau này deploy lên Zeebe thật, cần viết job worker cho từng type.
3. **`formDefinition externalReference`** trỏ về form của web-1 (Mantine UI), không phải Camunda Form — đây là mô hình tài liệu; nếu deploy thật, tạo `.form` tương ứng hoặc nối form renderer ngoài.
4. **Độ lệch đã biết (PR #19)** — ghi chú ⚠ trong `intake.bpmn` và `payment-and-credit.bpmn`: mua lượt khi case đang "Chờ thanh toán" đẩy case sang "Sẵn sàng nộp", việc nộp sau đó bị kẹt (xem `docs/research/brainstorm-2026-08-21-flow-confusion-intake-payment-credit.md`). Các sơ đồ vẽ luồng nghiệp vụ mong muốn (thứ tự nộp/trả tự do).
5. **`paymentStatus`/`caseStage` trong điều kiện gateway là biến khái niệm** (business term). Map sang tên thật khi nối engine: `paid|not_required|unpaid`, `intake_pending|intake_ready|submitted|completed` trong `apps/api/src/modules/cases/domain/case.types.ts`.

## Validate

```bash
cd docs/flows/camunda
for f in *.bpmn; do c8ctl bpmn lint "$f"; done     # phải ra "No issues found" cho cả 5 file
npx --yes dmnlint *.dmn                            # chạy từ repo root; zero output = pass (cần .dmnlintrc ở root)
```

Lint hiện tại: 5/5 BPMN + 3/3 DMN sạch (zero error, zero warning).

## Quy ước modeling (để đóng góp tiếp)

- `<bpmn:message>` nằm **ngoài** `<bpmn:process>` (root element của definitions).
- Message **start event**: message trần, không `zeebe:subscription`.
- Message **catch** (intermediate) và **throw** (end): message có `zeebe:subscription correlationKey="=..."`; message end event thêm `<zeebe:taskDefinition type="publish-message" />`.
- Không merge nhiều luồng vào thẳng một activity — luôn qua exclusive merge gateway (tránh `fake-join`).
- Gateway vừa join vừa fork là lỗi lint — tách thành 2 gateway.
- Business rule task: `decisionId` phải khớp `decision id` trong file `.dmn` (dùng `_`, không dùng `-`).
