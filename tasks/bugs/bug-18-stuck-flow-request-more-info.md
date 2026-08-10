# Bug 18: Kẹt luồng khi admin yêu cầu bổ sung

## Thông tin gốc (Google Docs)

> Lỗi kẹt luồng nếu admin ấn yêu cầu bổ sung. User nộp xong ra trang này kẹt luôn không phân chia hay duyệt được

## Phân tích

| Khía cạnh | Đánh giá |
|-----------|----------|
| Loại | Bug state machine — **blocker chặn production** |
| Effort | **XL** |
| Độ phức tạp | Cao: `need_more_information` → `revision_submitted` transition hỏng |
| Dependency | **Block #7, #15, #17** (cùng status flow) |
| Quyết định cần | Nhỏ — bug, fix ngay |
| Vùng code | `submitRevisionUseCase` / `submitRevisionUploadUseCase` (`apps/api/src/modules/cases/application/submit-revision.usecase.ts:104,209`), case status flow |

## Tracking

| Field | Value |
|-------|-------|
| Status | Backlog |
| Assignee | — |
| Priority | **Critical** |
| Target | — |
| Ghi chú | Fix trước tiên — mở đường cho #7, #15, #17 |

## Acceptance Criteria (draft)
- [ ] Admin yêu cầu bổ sung → user nộp xong → case không kẹt
- [ ] Case tiếp tục được phân chia/duyệt bình thường
- [ ] Không mất data sau transition
