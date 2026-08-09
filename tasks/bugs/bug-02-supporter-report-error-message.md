# Bug 2: Supporter gửi report khi chưa chat/upload → "lỗi hệ thống"

## Thông tin gốc (Google Docs)

> Nếu [user] mua credit rồi thì supporter cố tình gửi report lên khi chưa chat chưa upload bản sửa chữa thì thông báo "lỗi hệ thống" (bug à hay là chỉ là error message? User chưa upload tài liệu lên thì supporter k được upload tài liệu đánh giá là hợp lý mà? Nếu error message thì đổi lại là được)

**Note [b]:** ừ error message không phải bug

```
User upload tài liệu -> supporter upload báo cáo -> kết thúc lần 1
                                                          |
                Lỗi message               <-        Support upload lần 2
```

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Error message (KHÔNG phải bug — note [b] xác nhận) |
| Effort | **S** |
| Độ phức tạp | Rất thấp — chỉ đổi message text |
| Dependency | Không có |
| Quyết định cần | Không |
| Vùng code | Supporter report upload flow — error text hiện đang hiển thị "lỗi hệ thống" thay vì message mô tả nguyên nhân |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Low |
| Target | — |
| Ghi chú | Đổi error message sang thông báo rõ ràng "chưa đủ điều kiện để tải output" |

## Acceptance Criteria (draft)
- [ ] Supporter upload report khi user chưa chat/upload → thấy error message mô tả đúng nguyên nhân
- [ ] Không còn hiển thị chung chung "lỗi hệ thống"
