# Bug 4: Supporter hết credit khi gửi report lần 2

## Thông tin gốc (Google Docs)

> [supporter] hết credit? khi [supporter] upload file report lên lần 1 xong rồi [supporter] gửi report lần 2 ra thông báo này. Vậy khắc phục là sau khi upload report xong phải đánh dấu là xong nữa mới kết thúc 1 quy trình. Lỗi y chang ở phần 2 thôi khác chỗ có credit và không credit

```
User upload tài liệu -> supporter upload báo cáo -> kết thúc lần 1
                                                          |
                Lỗi message hết credit      <-        Support upload lần 2
```

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Flow/state machine |
| Effort | **M** |
| Độ phức tạp | Trung bình-cao: thêm bước "đánh dấu xong" sau upload + state machine |
| Dependency | #2, #5, #18 |
| Quyết định cần | Nhỏ |
| Vùng code | Supporter output upload → `submitSupporterOutputUploadUseCase` (`apps/api/src/modules/cases/application/submit-revision.usecase.ts:295`), flow "kết thúc quy trình" |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | Medium |
| Target | — |
| Ghi chú | Khắc phục: sau upload report xong phải đánh dấu xong mới kết thúc quy trình |

## Acceptance Criteria (draft)
- [ ] Supporter upload report lần 1 xong → quy trình kết thúc hẳn
- [ ] Gửi report lần 2 → bị chặn với message rõ ràng (hết credit / chưa đủ điều kiện)
- [ ] Có bước "đánh dấu xong" tường minh
