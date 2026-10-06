# Phase 03: Landing Pricing UI

## Target
- `apps/web-1/components/landing/LandingPricing.tsx` (File mới)
- `apps/web-1/app/page.tsx`

## Change
1. `LandingPricing.tsx`:
   - Dựng một component bằng Mantine v9 (`<Container>`, `<SimpleGrid cols={{ base: 1, sm: 2 }}>`, `<Card>`).
   - Card 1: "Basic AI Audit", giá 79.000 VNĐ. Nhấn mạnh việc xử lý tốc độ cao bằng AI.
   - Card 2: "Premium Mentor Audit", giá 149.000 VNĐ. Có `<Badge color="blue">Phổ biến</Badge>`. Nhấn mạnh việc có Mentor FPT trực tiếp review.
   - Nút Call-to-action (CTA) trên mỗi thẻ sử dụng `<Button component={Link} href="/dashboard/intake?packageId=..." />`.
2. `page.tsx`:
   - Import và chèn `<LandingPricing />` vào ngay bên dưới component `<FeaturesGrid />`.

## Acceptance
- Bảng giá hiển thị cân đối, đáp ứng responsive (1 cột trên mobile, 2 cột trên desktop).
- Không vỡ layout. Nút bấm đúng URL.
- Không sử dụng sai class Tailwind đè lên prop của Mantine.