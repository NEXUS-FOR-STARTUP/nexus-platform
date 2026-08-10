# Bug 17: Update intake mọi trạng thái hồ sơ (lui trang)

## Thông tin gốc (Google Docs)

> Có thể update [trang intake ở user] mọi trạng thái hồ sơ (BR: yêu cầu chỉ được update khi chưa gửi hồ sơ đến admin duyệt). Bằng cách lui trang về điền lại.

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Guard thiếu (FE + BE) |
| Effort | **M** |
| Độ phức tạp | Trung bình: guard status ở FE + BE |
| Dependency | #7, #18 (status flow) |
| Quyết định cần | Nhỏ — BR đã rõ: chỉ update khi chưa gửi |
| Vùng code | Intake form — `apps/web-1/app/dashboard/intake/` + API update guard |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | User lui trang → điền lại → update được kể cả khi đã gửi. Chặn update khi case đã gửi admin duyệt |

## Acceptance Criteria (draft)
- [ ] User không update được intake khi hồ sơ đã gửi (guard FE + BE)
- [ ] Hiển thị trạng thái khóa/chặn khi không được phép update
