# Functional Requirement: Case Workspace and Status

## 1. Document info

- Feature ID: F02
- Trạng thái: đang làm việc
- PRD reference: [`../prd/core-product-prd.md`](../prd/core-product-prd.md)
- Flow reference: [`../flows/case-lifecycle-flow.md`](../flows/case-lifecycle-flow.md)

## 2. Traceability

- Business reason: giu report, tai lieu, va lich su vong review trong cung mot noi de user va supporter khong mat boi canh.
- Target customer: user, supporter, admin.
- User problem: khong thay duoc case dang o dau, report nao dang co hieu luc, va can lam gi tiep theo.
- Product behavior: moi case co workspace rieng, status ro, document board, report panel, va timeline.
- Related user story: user can mo case va thay report moi nhat; supporter can mo case va thay lich su lien quan.
- Related acceptance criteria: case workspace hien du stage hien tai, next action, document board, va report dang co hieu luc.

## 3. Scope

### In scope

- user case workspace
- status badge va next action card
- document board
- report panel
- timeline toi thieu
- supporter/admin case detail
- history theo round

### Out of scope (MVP ban đầu)

- analytics dashboard sau
- chat tự do ngoài phạm vi case (hệ thống hiện tại đã hỗ trợ tab Trao đổi realtime qua Centrifugo v6 cho các gói có chuyên viên hỗ trợ)

## 4. Actors

- Primary actor: user
- Secondary actor: supporter, admin

## 5. Trigger

- Case duoc tao, duoc mo lai, hoac duoc nang cap sang round moi.

## 6. Inputs

- du lieu intake
- artifacts da upload/publish
- supporter actions
- admin actions
- revision submissions

## 7. Outputs

- case workspace cap nhat
- document board cap nhat
- next action cap nhat
- lich su round duoc giu

## 8. Processing rules

### Main behavior

- Workspace phai uu tien report va next action, khong phai metadata ky thuat.
- Document board la noi user xem tai lieu va report theo ngu canh.
- Report moi nhat phai duoc noi bat ro.
- User-facing labels phai de hieu hon naming ky thuat noi bo.

### Validation rules

- User chi thay case cua minh.
- Internal note va artifact noi bo khong duoc lo ra ngoai.
- Report dang co hieu luc phai duoc danh dau ro.

### Business rules

- Mot case co nhieu round, khong tao case moi cho moi vong sua.
- Khong ghi de report cu; report cu chi tro thanh lich su.
- User luon thay next action.
- Ban đầu không có tab hỏi đáp tự do; hiện tại đã hỗ trợ tab Trao đổi trực tiếp qua Centrifugo realtime cho các gói có chuyên viên hỗ trợ (ẩn với gói thuần AI `pkg_ai_audit`).

## 9. User stories

- As a user, I want one place to see all reports and related documents, so that I do not search across chat or file links.
- As a user, I want to know exactly what step comes next, so that I can move the case forward.
- As a supporter, I want to open a case and immediately see its current round and history, so that I do not lose context.

## 10. UI structure

### User case workspace

- header thong tin case
- status badge
- next action card
- report panel
- document board
- timeline panel

### Supporter/admin case detail

- summary panel
- document preview
- actions panel
- internal notes

## 11. Error and edge cases

- Case: case thieu du lieu sau khi da tao.
  Expected behavior: workspace hien ro dang cho user bo sung.

- Case: user dung lai sau khi nhan report va khong tiep tuc.
  Expected behavior: case duoc dong co ly do ro ma khong xoa lich su.

## 12. Acceptance criteria

- [ ] Moi case co workspace rieng.
- [ ] User thay duoc stage hien tai va next action.
- [ ] Workspace co report panel va document board ro rang.
- [ ] Report moi nhat duoc noi bat ro.
- [ ] Lich su round duoc giu trong he thong.
- [ ] Supporter/admin mo case va thay duoc boi canh can thiet.

## 13. Missing / unclear

- Ghi chú cập nhật: Hiện tại hệ thống đã hỗ trợ tab Trao đổi (Centrifugo WebSocket realtime + REST polling fallback) đối với các gói có supporter.
- User-facing stage labels uu tien cach noi de hieu:
  - `Nexus da nhan case`
  - `Can bo sung thong tin`
  - `Dang duoc xem xet`
  - `Da co report moi`
  - `Cho nhom cap nhat`
  - `Nexus da nhan ban sua`
  - `Da hoan tat`
  - `Case chua duoc nhan`
  - `Da dong`
