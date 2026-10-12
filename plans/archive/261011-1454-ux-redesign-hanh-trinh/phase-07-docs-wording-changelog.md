# Phase 7 — Docs, wording, changelog

## Context Links
- [plan.md](./plan.md)
- `design-system/wording/AGENTS.md`, `design-system/wording/pages/case-detail.md`, `wallet.md`
- `apps/web-1/AGENTS.md`, root `AGENTS.md`, `CHANGELOG.md`, `docs/system-architecture.md`

## Overview
- Priority: P3.
- Status: Pending.
- Cập nhật tài liệu theo kiến trúc mới. Không đổi code.

## Requirements
1. Wording: thay `case-detail.md` bằng inventory theo tab mới:
   - Overview (Việc tiếp theo).
   - Journey.
   - Stage detail (3 view).
   - Billing.
   - Audit confirm, checkout.
   - Hồ sơ dự án.

   Theo SOP 3 lớp; ảnh chụp desktop + mobile.
2. `apps/web-1/AGENTS.md`:
   - Số tab, quy ước `?tab=journey&stage=&view=`.
   - Luật "không hiện CP trong UI".
   - Luật chỗ đặt mua/chấm/kết quả.
3. Root `AGENTS.md`:
   - Bỏ mô tả 7 tab.
   - Ghi supporter đã đóng băng.
   - Thêm `NEXT_PUBLIC_ZALO_GROUP_URL`.
4. `docs/system-architecture.md`:
   - Trạng thái giai đoạn suy ra.
   - Luật đầu vào chấm.
   - Bỏ tự chấm.
   - Upload theo `checkpoint_code`.
5. `CHANGELOG.md`: mục breaking change (tab cũ chuyển hướng, tạo dự án không cần gói, bỏ tự chấm, supporter/chat tắt).
6. `design-system/MASTER.md` đã lỗi thời (màu, font): ghi chú trỏ về token thật hoặc cập nhật.
7. Cutover sau khi flag bật ổn định trên prod: xóa trang cũ, các file đã liệt kê ở phase 3–4, nhánh `false` của flag và chính 2 flag; chuyển hướng `?tab=` cũ giữ lại.
8. Cập nhật `plan.md` trạng thái các phase.

## Todo List
- [ ] Wording inventory mới
- [ ] AGENTS.md (root + web-1)
- [ ] system-architecture
- [ ] CHANGELOG
- [ ] MASTER.md
- [ ] Trạng thái plan
