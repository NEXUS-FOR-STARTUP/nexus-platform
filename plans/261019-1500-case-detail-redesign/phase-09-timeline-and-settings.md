# Phase 9: Lịch sử hoạt động + Cài đặt dự án

Priority: P3 · Status: Pending · Effort: 4h · blockedBy: Phase 1, 2 · Q5

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/timeline.js` (21), `js/views/settings.js` (63); `REPORT.md` §8 ("khóa, không sửa thêm")
- `research/scout-02` §2 "Timeline", "Settings"; `reports/gap-register.md` C-08, C-20, C-21
- Code: `CW/ActivityTimeline.tsx` (79), `CW/TabCaseSettings.tsx` (198), `CW/CaseContactFields.tsx` (44), `CW/CaseDeleteSection.tsx` (125), `hooks/useCaseDetails.ts` (`updateSettings`, `contact`, `deleteCase`), `validateCaseContact`, `isCaseContactComplete`

## Key insights
- Timeline: API chỉ gửi **50 sự kiện mới nhất** (`case.repository.ts:85-93`); UI hiện xếp **cũ trước** và loại `message_sent`. Mockup nhóm theo ngày, lọc theo loại (Tất cả / Chấm bài / Lượt chấm / Dự án), mới trước. Đổi thứ tự là thay đổi hành vi nhỏ (Q5); nhóm + lọc client-side chỉ trên 50 dòng, cần nhãn "Hiển thị 50 sự kiện gần nhất" để không ẩn lặng lẽ.
- Settings (mockup coi "đã khóa"): bắt buộc `team_name`, `school`, `course_context` + `validateCaseContact(contact, true)` (người liên hệ: họ tên, điện thoại/Zalo, email bắt buộc); lỗi từng trường, toast xanh/đỏ, trích message lỗi từ `err.response.data`. Mockup mới: nút Lưu chỉ bật khi có sửa (C-21), lỗi xóa khi gõ, focus vào ô lỗi đầu tiên.
- Mockup vẽ hộp "Xoá dự án" luôn hiện; thật chỉ hiện khi `stage === "submitted"` và gõ `DELETE` (C-20). **Giữ điều kiện thật.**
- `TabCaseSettings` 198 dòng: sát giới hạn.
- Cảnh báo `showContactHint` (hiện khi `tab=settings` và liên hệ chưa đủ): giữ.
- Trường Telegram, mã sinh viên, vai trò: mockup có; code thật khớp (scout-02 §GAPS "contact form fields... match").

## Requirements
**Timeline**
- Nhóm theo ngày (mới nhất trước), mỗi nhóm `Accordion` mở sẵn (nhóm mới nhất) / gập ở mobile; bộ lọc loại dùng Tabs gạch dưới (mockup: cùng thành phần); sự kiện có icon trên đường dọc, tiêu đề đậm, giờ, chi tiết, "Thực hiện bởi …".
- Nhãn "Hiển thị 50 sự kiện gần nhất" khi `events.length === 50`.
- Cột `narrow` 720px.
**Settings**
- Hai mục: "Thông tin dự án" (tên nhóm*, nhóm số, trường*, lớp*) và "Người liên hệ" (họ tên*, mã SV, vai trò, SĐT/Zalo*, email*, Telegram); ghi chú "áp dụng cho dự án này".
- `Button` Lưu `disabled` khi `!isDirty || isUpdatingSettings`; lỗi hiển thị bằng `error` của `TextInput`; focus ô lỗi đầu tiên khi submit sai.
- Hộp "Xoá dự án" như cũ.

## Architecture
```
ActivityTimeline.tsx (≤100)   nhóm + lọc
 ├─ activity-groups.ts        groupEventsByDay, countByKind (+ test)
 ├─ TimelineDayGroup.tsx
 └─ TimelineEventItem.tsx
TabCaseSettings.tsx (≤150)    vỏ, form
 └─ CaseProjectFields.tsx     4 trường dự án (mới, tách để ≤200)
```

## Related code files
**Modify:** `ActivityTimeline.tsx`, `TabCaseSettings.tsx`, `CaseContactFields.tsx` (chỉ style), `CaseDeleteSection.tsx` (chỉ style).
**Create:** `activity/activity-groups.ts` (+ test), `activity/TimelineDayGroup.tsx`, `activity/TimelineEventItem.tsx`, `CaseProjectFields.tsx`.
**Delete:** không.

## Implementation steps
1. `activity-groups.ts`: `groupEventsByDay(events, tz = "Asia/Ho_Chi_Minh")` trả `[{ dayKey, label, events[] }]` mới nhất trước; `kindOf(event)` map `event_type` → `grading | credit | project`; `countByKind`. Test 5 ca: rỗng, 1 ngày, nhiều ngày, ranh giới nửa đêm theo múi giờ, loại không map → `project`. Múi giờ là hằng có tên, không gõ cứng trong hàm.
2. `TimelineEventItem`: icon Lucide theo loại trong vòng tròn 32px; đường dọc bằng CSS module (token `--color-border-strong`, **được phép** vì không phải "thin rule" trang trí mà là cấu trúc timeline; ghi chú `taste-skill-ignore` như mockup nếu lint cảnh báo).
3. `ActivityTimeline`: giữ lọc `message_sent`; thêm Tabs lọc loại (`UNDERLINE_TABS_CLASSES`) với số đếm; nhãn 50 sự kiện.
4. `TabCaseSettings`: tách `CaseProjectFields`; giữ `useForm` hiện có (TanStack Form); thêm `form.Subscribe` cho `isDirty`/`isSubmitting` → `Button disabled`.
5. Focus ô lỗi đầu tiên: `form.getFieldMeta`/ref theo thứ tự trường; thử với `scrollIntoView({ block: "center" })` + `.focus()`.
6. Giữ chuỗi lỗi và toast cũ nguyên văn; xác nhận bằng grep trước/sau.
7. Smoke: timeline 0/1/nhiều ngày/50 sự kiện; lọc loại; settings: lưu không sửa (nút khóa), xóa 1 trường bắt buộc (lỗi + focus), lưu thành công, xóa dự án (chỉ khi `submitted`). 1440/390.

## Todo
- [ ] Chốt Q5
- [ ] `activity-groups.ts` + test
- [ ] Timeline UI + nhãn 50 sự kiện
- [ ] Tách `CaseProjectFields`
- [ ] Dirty-gate nút Lưu
- [ ] Focus lỗi đầu tiên
- [ ] Smoke 8 ca

## Success criteria
- Chuỗi lỗi/toast không đổi (diff grep).
- Nút Lưu khóa khi không sửa; mở khi sửa; khóa lại sau lưu thành công.
- Timeline: nhóm đúng múi giờ VN; không mất sự kiện so với bản cũ (so số sự kiện trước/sau).
- File ≤200 dòng.

## Risks
| Rủi ro | Xử lý |
|---|---|
| `isDirty` của TanStack Form tính khác khi giá trị mặc định thay đổi sau fetch | Kiểm `defaultValues` đặt lại sau khi dữ liệu về (`form.reset`) |
| Nhóm theo ngày sai lệch múi giờ máy khách | Dùng hằng múi giờ VN, test ranh giới nửa đêm |
| Đổi thứ tự timeline làm người dùng quen thứ tự cũ bối rối | Q5; có nhãn rõ |

## Security
Xóa dự án giữ gõ `DELETE` + kiểm server. Không log dữ liệu liên hệ (PII).

## Next steps
P10.
