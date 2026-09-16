---
title: "Chuẩn hóa thuật ngữ thương hiệu: Thay thế 'OMP Engine' thành 'Nexus Engine' / 'Nexus AI Engine' trên User-Facing UI"
status: pending
created: 2026-09-16
author: AI Agent & Product Team
tags: [branding, terminology, ui-ux, frontend, clean-code]
blocks: []
blockedBy: []
---

# Kế hoạch Kỹ thuật: Chuẩn hóa thuật ngữ thương hiệu User-Facing UI

## 1. Bối cảnh & Vấn đề (Context & Issue)
- **Vấn đề**: Trong đợt cập nhật Adaptive Intake Form vừa qua, một đoạn alert mới được thêm vào Bước Xác nhận (`ReviewSubmitStep.tsx`) để giải thích cho sinh viên biết gói 79k là gói tự động. Tuy nhiên, lập trình viên đã viết nhầm tên công nghệ nền tảng nội bộ là `"OMP Engine"`.
- **Nguyên tắc**: 
  - `"OMP"` / `"OMP Engine"` / `"OMP Worker"` là tên mã kiến trúc kỹ thuật nội bộ (Internal Technology).
  - Đối với người dùng (sinh viên, giảng viên, khách hàng), tên thương hiệu chính thức hiển thị ra ngoài phải là **`Nexus Engine`** hoặc **`Nexus AI Engine`**. Tuyệt đối không để lộ lõi công nghệ nội bộ ra ngoài giao diện.

## 2. Các điểm rà soát từ Scout Agent
1. **Frontend UI (`apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`)** (Bị lộ trực tiếp ra khách hàng):
   - Dòng 83: `"Đây là hồ sơ bàn giao để OMP Engine bắt đầu thẩm định..."` $\rightarrow$ Đổi thành: `"Đây là hồ sơ bàn giao để Nexus AI Engine bắt đầu thẩm định..."`
   - Dòng 120: Badge `<Badge>OMP Engine - 5 Tiêu chí Rubric</Badge>` $\rightarrow$ Đổi thành: `<Badge>Nexus AI Engine - 5 Tiêu chí Rubric</Badge>`
   - Dòng 207: Tên gói fallback `"Đánh giá ý tưởng tự động bằng AI (OMP Engine)"` $\rightarrow$ Đổi thành: `"Đánh giá ý tưởng tự động bằng AI (Nexus AI Engine)"`
2. **Radar Log Filter (`apps/web-1/app/dashboard/case/[id]/_components/radar.utils.ts`)**:
   - Bổ sung thêm các keyword `"omp"`, `"omp runner"` vào danh sách `DIRTY_LOG_KEYWORDS` để phòng vệ từ xa, không cho bất kỳ log nền tảng nào lọt ra thanh radar tiến độ.
3. **API Responses & Worker Logs (Nâng cao bảo vệ rò rỉ)**:
   - `apps/api/src/modules/cases/http/cases-ai.controller.ts`: Đổi message trả về client thành `Nexus AI Engine`.

## 3. Các bước triển khai (Execution Steps)
- **Bước 1**: Sửa `ReviewSubmitStep.tsx`: Thay thế toàn bộ 3 vị trí hiển thị `"OMP Engine"` thành `"Nexus AI Engine"`.
- **Bước 2**: Sửa `radar.utils.ts`: Thêm `"omp"` vào blacklist `DIRTY_LOG_KEYWORDS`.
- **Bước 3**: Sửa `cases-ai.controller.ts`: Cập nhật response message.
- **Bước 4**: Chạy `bun run check-types` kiểm tra.
- **Bước 5**: Commit sạch sẽ: `fix(branding): rename internal omp engine to nexus ai engine in user-facing ui`.
