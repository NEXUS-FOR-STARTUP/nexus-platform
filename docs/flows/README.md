# Tài liệu flow

Chứa user flow + operational flow canonical.

Quy tắc:

1. Flow mô tả thứ tự hành vi + state transition ở mức sản phẩm.
2. Flow không lặp lại toàn bộ functional requirement.
3. Flow phải trỏ về PRD + requirement liên quan.

## Đọc đầu tiên

- [`cp1-audit-end-to-end-flow.md`](./cp1-audit-end-to-end-flow.md)

Sau đó:
- [`intake-flow.md`](./intake-flow.md)
- [`payment-verification-flow.md`](./payment-verification-flow.md)
- [`admin-triage-and-assignment-flow.md`](./admin-triage-and-assignment-flow.md)
- [`case-lifecycle-flow.md`](./case-lifecycle-flow.md)
- [`team-fit-flow.md`](./team-fit-flow.md)
- [`cp1-mvp-screen-spec.md`](./cp1-mvp-screen-spec.md)
- [`camunda/README.md`](./camunda/README.md) — bộ file BPMN + DMN chuẩn OMG mô tả cùng các flow trên
  (mở bằng Camunda Modeler / bpmn.io; đã qua lint `c8ctl bpmn lint` + `dmnlint`)
