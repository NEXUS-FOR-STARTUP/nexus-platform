---
title: "Tái cấu trúc Form Intake thích ứng theo gói dịch vụ (79k/149k) và Chuẩn hóa UX Danh mục tài liệu"
status: completed
created: 2026-09-16
completed: 2026-09-16
author: AI Agent & Product Team
tags: [intake, ux-ui, package-adaptation, validation, frontend, backend]
blocks: []
blockedBy: []
---

# Báo cáo Hoàn thành: Tái cấu trúc Form Intake thích ứng theo gói & Chuẩn hóa UX Danh mục tài liệu

## 1. Trạng thái thực thi (Execution Status)
- **Phase 1: Hợp đồng dữ liệu & Danh mục tài liệu**: ĐÃ HOÀN THÀNH (100%)
- **Phase 2: Frontend Adaptive Intake Form & Tối ưu Giao diện**: ĐÃ HOÀN THÀNH (100%)
- **Phase 3: Kiểm thử & Đảm bảo Không Hồi quy**: ĐÃ HOÀN THÀNH (100%)

## 2. Các thay đổi chính đã áp dụng
1. `packages/validation/src/index.ts`:
   - Chuẩn hóa 5 danh mục tài liệu mới: Thuyết minh ý tưởng, Slide thuyết trình, Nghiên cứu thị trường, Kế hoạch tài chính, Tài liệu bổ sung (cấm '/', '()', '&').
   - Export `canonicalizeDocCategory` và `docCategoryLabel` với fallback đầy đủ.
   - Nới lỏng `Cp1IntakeSchema`: chuyển `support_needs` thành optional.
2. `apps/api`:
   - `list-admin-cases.usecase.ts`: Phân bổ trọng số completeness theo gói (4 tiêu chí x 25% cho gói 79k).
   - `cp1-intake-validation.test.ts`: Pass 100% (63/63 tests).
3. `apps/web-1`:
   - Hỗ trợ an toàn 2 luồng truy cập (`caseId` và `packageId`), không flicker.
   - Gói 79k: Stepper 6 bước mượt mà (bỏ bước Support Needs), banner SLA 1 phút, form gửi payload sạch không rác supporter.
   - Gói 149k: Giữ 7 bước đầy đủ với thông tin Mentor.
   - Document Workspace: tự động gộp các file cũ vào 1 accordion "Nghiên cứu thị trường" duy nhất.
4. Database Script:
   - Viết sẵn script migration an toàn: `prisma/migrations/manual_canonicalize_doc_categories.sql`.
