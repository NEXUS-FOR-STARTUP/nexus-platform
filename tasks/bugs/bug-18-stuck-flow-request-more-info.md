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
| Status | Done (2026-08-14 — plan `260814-1825-reject-resubmit-loop-fix`) |
| Assignee | — |
| Priority | **Critical** |
| Target | — |
| Ghi chú | Fix trước tiên — mở đường cho #7, #15, #17 |

## Acceptance Criteria (draft)
- [x] Admin yêu cầu bổ sung → user nộp xong → case không kẹt
- [x] Case tiếp tục được phân chia/duyệt bình thường
- [x] Không mất data sau transition

> **Done note:** vòng reject → edit → resubmit chạy trọn qua `POST /cases/:id/intake` atomic (T3/T4 theo sự kiện gần nhất, không dead state); admin request-more-info đã xóa (giao tiếp triage = lý do từ chối T12 ≥10 ký tự); tx atomic không mất data.
