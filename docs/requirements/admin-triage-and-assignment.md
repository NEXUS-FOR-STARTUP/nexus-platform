# Functional Requirement: Admin Triage and Assignment

## 1. Document info

- Feature ID: F03
- Trạng thái: đang làm việc
- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Flow reference: [`../flows/admin-triage-and-assignment-flow.md`](../flows/admin-triage-and-assignment-flow.md)

## 2. Traceability

- Business reason: moi case moi phai duoc nhan, tu choi, hoac giao dung nguoi xu ly.
- Target customer: admin, supporter, user.
- User problem: case da gui nhung khong biet co duoc nhan khong; supporter khong biet case nao minh phai lam.
- Product behavior: admin triage case moi, quyet dinh accept/reject/assign supporter.
- Related user story: admin can scan nhanh queue; user can biet case da duoc nhan hay can bo sung.
- Related acceptance criteria: moi case moi di qua triage queue va co owner ro neu duoc nhan.

## 3. Scope

### In scope

- admin triage queue
- admin case detail
- accept case
- reject case
- assign supporter

### Out of scope

- auto-assignment phuc tap
- SLA engine phuc tap

## 4. Actors

- Primary actor: admin
- Secondary actor: user, supporter

## 5. Trigger

- User submit case moi.

## 6. Inputs

- case submission
- deadline / urgency
- tai lieu da nop
- feedback giang vien neu co

## 7. Outputs

- decision triage
- supporter duoc assign neu can
- timeline ghi lai action va ly do

## 8. Processing rules

### Main behavior

- Admin queue phai cho phep scan nhanh case moi.
- Admin mo case va ra quyet dinh trong it buoc nhat co the.
- Case accept nhung chua assign phai duoc danh dau ro.

### Validation rules

- Reject phai co ly do (toi thieu 10 ky tu).
- Yeu cau bo sung (supporter thuc hien qua machine T8) phai co noi dung can bo sung ro rang.
- Assign supporter phai gan voi supporter hop le.

### Business rules

- Case moi khong duoc trôi nổi khong owner neu da accept.
- Case ngoai pham vi hoac input qua thieu co the bi reject hoac yeu cau bo sung.
- Admin khong con action request more info (xoa 2026-08-14); reject reason la kenh trao doi triage; yeu cau bo sung do supporter thuc hien (T8) sau khi duoc assign.

## 9. User stories

- As an admin, I want to scan new cases quickly, so that I can decide what enters the workflow.
- As an admin, I want to assign a supporter clearly, so that ownership is not ambiguous.
- As a user, I want to know whether my case was accepted, rejected, or needs more information.

## 10. Error and edge cases

- Case: case khong du tai lieu de supporter bat dau.
  Expected behavior: admin duyet roi de supporter yeu cau bo sung (T8), hoac reject voi ly do ro.

- Case: case ngoai pham vi hien tai.
  Expected behavior: admin reject voi ly do ro.

- Case: chua co supporter phu hop.
  Expected behavior: case o trang thai accepted_unassigned cho den khi duoc gan owner.

## 11. Acceptance criteria

- [ ] Moi case moi xuat hien trong triage queue.
- [ ] Admin co the accept, reject, va assign supporter.
- [ ] Reject co ly do ro.
- [ ] Yeu cau bo sung (supporter, T8) co noi dung can bo sung ro.
- [ ] Case da accept co owner ro hoac o trang thai accepted_unassigned.

## 12. Missing / unclear

- Superseded (2026-08-14): admin request more info da xoa — yeu cau bo sung chuyen ve supporter (machine T8) sau khi duoc assign.
- Needs decision: rule uu tien case theo deadline / urgency o phase 1.
