---
title: "GA-08 brainstorm: luật chơi + nhóm UI 2 section"
status: agreed
date: 2026-08-28
ticket: tasks/bugs/ga-08-notification-preferences.md
plan: plans/260828-1900-ga08-notification-preferences/plan.md
flow: Cài đặt thông báo
---

# Luật chơi + UI grouping — Cài đặt thông báo

## Problem

Màn `/dashboard/settings/notifications` (và `/supporter/settings/notifications`) hiện 4 Switch cùng visual weight.

Copy nói **nhóm** và **kênh**. User đọc 2 trên / 2 dưới. UI không đánh dấu 2 loại. Thành 4 việc độc lập.

Backend GA-08: 2 nhóm × 2 kênh, **AND**. Không khớp mặt UI.

## Requirements (đã duyệt)

- Viết luật chơi (góc user), không review code.
- Ghi cả hai luật, rồi chốt một.
- UI: 2 section + 4 switch.
- Commit: giữ nút Lưu. Switch = draft.
- Không matrix, không auto-save, không thêm chat / marketing / telegram.

## Luật chơi

Flow: **Cài đặt thông báo**
Chức năng: **Chọn nhóm sự kiện và kênh nhận, rồi Lưu**

### Vào màn

- **Trigger:** Settings → "Cài đặt thông báo".
- **Phản hồi:** Card "Cài đặt thông báo". Subtitle: chọn nhóm và kênh, nhấn Lưu để áp dụng. 4 switch (mặc định bật nếu chưa từng lưu). Nút Lưu.
- **Modifier:** không.
- **Gián đoạn:** Back / nav khác trước khi data về → không đổi server.
- **Edge:** Lỗi tải → không form, không Lưu. Loading → text đang tải.
- **Tương tác chéo:** Chuông / email chưa đổi cho đến khi Lưu thành công.

### Bấm 1 switch

- **Trigger:** Click track, thumb, hoặc label/description của hàng đó.
- **Phản hồi:** Chỉ hàng đó đổi on/off. 3 hàng kia giữ. Không toast. Không Lưu.
- **Modifier:** Shift/Ctrl/Alt không đổi luật.
- **Gián đoạn:** Esc không đóng card (không phải modal). Click ngoài card không revert. Reload / rời trang trước Lưu → draft mất, server giữ bản cũ.
- **Edge:** Bấm liên tiếp 1 hàng → last local state. Bấm lúc Lưu đang chạy → **AMBIGUOUS** (disable hay vẫn flip).
- **Tương tác chéo:** Tắt "Email" không tự tắt nhóm. Tắt "Cập nhật trạng thái dự án" không tự tắt kênh. Nhìn như 4 bit độc lập.

### Bấm Lưu

- **Trigger:** Click "Lưu".
- **Phản hồi thành công:** Toast thành công. 4 switch giữ giá trị vừa lưu. Đó là bản server mới.
- **Phản hồi lỗi:** Toast lỗi. Draft local **AMBIGUOUS** (giữ hay rollback).
- **Modifier:** không.
- **Gián đoạn:** Navigate giữa lúc đang Lưu → **AMBIGUOUS**.
- **Edge:** Lưu khi chưa đổi gì → vẫn gửi 4 giá trị hiện tại (no-op hữu hình). Double-click Lưu → **AMBIGUOUS**.
- **Tương tác chéo:** Sau Lưu thành công, event mới tuân theo AND. Event đã xếp hàng trước đó không thu hồi.

### Rời trang không Lưu

- **Trigger:** Nav, Back, đóng tab.
- **Phản hồi:** Không confirm. Draft biến mất.
- **Edge:** Hai tab cùng user: tab B Lưu, tab A Lưu đè. Last write wins.

### Không có trên màn (vẫn là luật hệ thống)

Telegram / chat / marketing không hiện, không tắt được. User không có switch tương ứng.

## Hai luật (chưa chốt → đã chốt)

| | Luật A — copy + hệ thống | Luật B — mặt 4 switch |
|---|---|---|
| Đơn vị | 2 nhóm + 2 kênh | 4 công tắc cùng loại |
| Kết hợp | AND: cần nhóm bật **và** kênh bật | Mỗi bit độc lập |
| Commit | "Nhấn Lưu để áp dụng" | Switch thường = áp dụng ngay |
| Thực tế hiện tại | A đúng sau Lưu | B đúng lúc đang bấm |

**Chốt:** Luật A. UI phải dạy A. 2 section. Vẫn Lưu.

AND:

- Nhóm tắt → không nhận loại đó, dù kênh còn bật.
- Kênh tắt → không gửi qua kênh đó, dù nhóm còn bật.
- Cả hai kênh tắt → không in-app, không email (kênh khác ngoài màn không bàn).
- Cả hai nhóm tắt, kênh còn bật → không case, không payment.

## Bảng nhất quán

| Hành động | Kỳ vọng luật A | Kỳ vọng luật B | Ghi |
|---|---|---|---|
| 4 switch giống nhau | 2 loại phải khác nhóm visual | 4 peer | Mâu thuẫn mặt. Design sửa bằng section. |
| Bấm switch | Draft, chưa áp dụng | Áp dụng ngay | Copy về phe A. Giữ Lưu = chấp nhận lệch convention switch. |
| Tắt Email, giữ nhóm bật | Hết email, còn in-app cho nhóm bật | "Tắt email" như một feature rời | A |
| Tắt nhóm dự án, giữ kênh bật | Hết case, còn payment trên kênh bật | "Tắt dự án" rời | A |
| Rời trang sau khi bấm, chưa Lưu | Mất draft | Đã lưu | A, rủi ro. User duyệt: không thêm "Chưa lưu". |
| Lưu không đổi | Ghi lại cùng state | Nút không cần hiện | Chấp nhận Lưu luôn bấm được. |

## Bất thường / mơ hồ

- **AMBIGUOUS:** Switch + Lưu trên cùng màn. Nhiều product: switch = instant. Cần copy subtitle giữ nguyên để chống đọc nhầm.
- **AMBIGUOUS:** Lưu fail — draft giữ hay revert.
- **AMBIGUOUS:** Switch lúc `Lưu` pending.
- **AMBIGUOUS:** Không dirty state. User không biết đã Lưu chưa. Chấp nhận trong duyệt này.
- Không khẳng định bug runtime. Mâu thuẫn chắc: **4 peer visual vs luật 2×2 AND**. Đó là lỗ hổng luật chơi, không phải "xấu".

## Approaches đã cân

| | Cách | Pros | Cons | Quyết |
|---|---|---|---|---|
| 1 | 2 section + 4 switch + Lưu | KISS, đúng AND, ít control mới | Vẫn lệch convention switch-instant | **Chọn** |
| 2 | Ma trận 2×2 | AND nhìn thấy | Nặng, giống admin | Loại |
| 3 | Chỉ 2 dòng heading, không divider | Nhẹ | Scan nhanh vẫn 4 peer | Loại |
| 4 | Bỏ Lưu, PUT từng switch | Đúng convention switch | Đổi luật commit, error per-row | Loại |
| 5 | Lưu + badge Chưa lưu | Giảm Ambiguous commit | User không chọn | Không làm vòng này |

## Design đã duyệt

1. Section **Nhóm thông báo**
   - Cập nhật trạng thái dự án
   - Cảnh báo thanh toán
2. Divider
3. Section **Kênh nhận**
   - Thông báo trong ứng dụng
   - Email
4. Nút **Lưu** dưới cùng
5. Giữ title + subtitle hiện tại
6. Một dòng phụ mỗi section (không dài):
   - Nhóm: "Tắt nhóm thì không nhận loại đó."
   - Kênh: "Tắt kênh thì không gửi qua kênh đó."
7. Không thêm switch. Không đổi AND. Không đổi API.

## Implementation notes (chưa làm)

- Chỉ UI form. Hook/API/schema không đổi.
- Student + supporter dùng chung form — sửa một chỗ.
- Không auto-save.
- File size / Mantine: section = `Text` heading + `Stack`, không `fixed`/`inset-0` lên Switch.

## Success

- User chỉ ra được 2 trên = nhóm, 2 dưới = kênh, không cần giải thích.
- Bấm switch không Lưu → reload ra state cũ.
- Lưu xong → AND đúng: nhóm tắt chặn loại; kênh tắt chặn kênh.
- Không hiện chat / marketing / telegram.

## Risks

- Giữ Lưu: user quen switch-instant sẽ tưởng đã áp dụng. Subtitle + section copy phải gánh.
- Không dirty indicator: Lưu no-op im lặng (trừ toast nếu vẫn gọi API).

## Next

Hỏi có lập plan implement không. Chưa code.
