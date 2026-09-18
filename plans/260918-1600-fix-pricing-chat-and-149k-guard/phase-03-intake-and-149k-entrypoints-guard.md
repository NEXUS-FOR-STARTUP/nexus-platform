# Phase 3: Intake and 149k Entrypoints Guard

## Overview
- **Date:** 2026-09-18
- **Priority:** P1
- **Status:** Completed
- **Target:** 
  - `apps/web-1/app/dashboard/intake/page.tsx`
  - `apps/web-1/app/auth/get-auth-redirect.ts`
  - `apps/web-1/components/landing/LandingPricing.tsx`
  - `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx`
  - `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`

## Key Insights
1. Người dùng có thể bypass modal chọn gói qua 3 đường: Landing page button (`href=...pkg_supporter_audit`), URL query param trực tiếp `/dashboard/intake?packageId=pkg_supporter_audit`, và sau đăng nhập từ `get-auth-redirect.ts`.
2. UI thẻ gói 149k vẫn gắn badge "Khuyên dùng" và nút "Chọn Premium" vẫn màu xanh như bình thường.
3. Tiêu đề mục 4 tại bước 6 Intake vẫn là "4. Hạn chót & gói dịch vụ" dù đã bỏ trường hạn chót.

## Requirements
1. **Intake page (`apps/web-1/app/dashboard/intake/page.tsx`):**
   - Trong `IntakePageContent`, nếu `!isUpdateMode && packageId === PACKAGE_KEYS.SUPPORTER_AUDIT` (hoặc `"pkg_supporter_audit"`):
     - Hiển thị Alert thông báo: "Gói Premium Mentor Audit hiện đang được hoàn thiện. Vui lòng chọn gói Basic AI Audit (79.000đ) để được phản biện tức thì."
     - Nút điều hướng "Chuyển sang gói Basic AI Audit" (`href="/dashboard/intake?packageId=pkg_ai_audit"`).
2. **Auth redirect (`apps/web-1/app/auth/get-auth-redirect.ts`):**
   - Nếu `packageId === PACKAGE_KEYS.SUPPORTER_AUDIT`, fallback về `/dashboard/intake?packageId=pkg_ai_audit` (hoặc `/dashboard`).
3. **Landing Pricing (`apps/web-1/components/landing/LandingPricing.tsx`):**
   - Đổi Badge "Khuyên dùng" thành "Sắp ra mắt" (hoặc variant nhẹ/dimmed).
   - Nút "Chọn gói Premium" đổi text thành "Sắp ra mắt", `disabled` hoặc mở thông báo / không link thẳng vào intake 149k.
4. **PackageSelectionModal (`apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx`):**
   - Đổi Badge "Khuyên dùng" trên thẻ 149k thành "Sắp ra mắt" (color="gray" hoặc "blue" variant="outline").
   - Nút "Chọn Premium" đổi thành "Sắp ra mắt", `disabled={true}` hoặc hiển thị rõ tính năng đang hoàn thiện.
5. **ReviewSubmitStep (`apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`):**
   - Đổi tiêu đề dòng 173 thành: `<h3 ...>4. Gói dịch vụ & Thời gian xử lý</h3>`.

## Success Criteria
- Không còn bất kỳ đường dẫn nào để sinh viên nộp hồ sơ gói 149k.
- UI thể hiện tính nhất quán và rõ ràng cho trạng thái "Sắp ra mắt".
