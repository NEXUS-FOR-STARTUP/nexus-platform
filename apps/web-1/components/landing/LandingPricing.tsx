"use client";

import { Container, SimpleGrid, Card, Text, Badge, Button, Title, Box } from "@mantine/core";
import { Check } from "lucide-react";
import Link from "next/link";
import { PACKAGE_KEYS } from "@/lib/pricing";

export default function LandingPricing() {
  return (
    <Box id="pricing" py={80} bg="surface-app" className="transition-colors duration-200">
      <Container size="lg">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Title order={2} className="font-heading text-3xl sm:text-4xl font-bold text-text-app">
            Bảng Giá Dịch Vụ
          </Title>
          <Text className="font-body text-sm sm:text-base text-text-muted leading-relaxed">
            Lựa chọn gói kiểm tra phù hợp với mục tiêu và tiến độ dự án của bạn. 
            Mọi tiêu chí đều bám sát tiêu chuẩn khởi nghiệp thực chiến.
          </Text>
        </div>

        {/* Pricing Cards */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className="max-w-4xl mx-auto items-stretch">
          {/* Card 1: Basic AI Audit */}
          <Card 
            padding={0}
            radius="lg" 
            withBorder 
            className="border-border-app bg-surface-card flex flex-col p-6 sm:p-8 hover:border-border-strong transition-all duration-200"
          >
            {/* Header Block */}
            <div className="flex flex-col flex-1">
              {/* Badge placeholder to equalize height with Premium card */}
              <div className="h-6 mb-2 flex items-center">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Gói tự động</span>
              </div>

              <Text className="font-heading text-xl sm:text-2xl font-bold text-text-app mb-2">
                Basic AI Audit
              </Text>

              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="font-heading text-3xl sm:text-4xl font-extrabold text-text-app tracking-tight">
                  79.000
                </span>
                <span className="font-body text-sm font-medium text-text-muted">
                  VNĐ / lượt
                </span>
              </div>

              {/* Description with fixed min-height for baseline alignment */}
              <p className="font-body text-sm text-text-muted leading-relaxed min-h-[48px] mb-6">
                Phù hợp cho các nhóm cần nộp bài gấp, rà soát khung sườn và sửa các lỗi logic cơ bản nhanh chóng.
              </p>

              {/* Divider */}
              <div className="border-t border-border-app/70 pt-6 mb-8 flex-1">
                <ul className="space-y-3.5 list-none p-0 m-0">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Đánh giá hoàn toàn tự động bằng AI
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Phân tích theo Rubric chuẩn (5 tiêu chí cốt lõi)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Nhận báo cáo chi tiết ngay lập tức (&lt; 1 phút)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Chỉ ~15.000đ/bạn khi chia theo nhóm 5 người
                    </span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                component={Link}
                href={`/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`}
                fullWidth
                size="md"
                variant="default"
                radius="md"
                className="font-body text-sm font-semibold h-11 border-border-app hover:border-border-strong text-text-app hover:bg-surface-app transition-all mt-auto"
              >
                Bắt đầu kiểm tra
              </Button>
            </div>
          </Card>

          {/* Card 2: Premium Mentor Audit */}
          <Card 
            padding={0}
            radius="lg" 
            withBorder 
            className="border-brand/40 bg-surface-card flex flex-col p-6 sm:p-8 hover:border-brand transition-all duration-200"
          >
            {/* Header Block */}
            <div className="flex flex-col flex-1">
              {/* Badge matching the height of Card 1's subtitle */}
              <div className="h-6 mb-2 flex items-center">
                <Badge 
                  variant="filled" 
                  color="blue" 
                  size="sm" 
                  radius="sm"
                  className="font-body font-semibold px-2"
                >
                  Phổ biến nhất
                </Badge>
              </div>

              <Text className="font-heading text-xl sm:text-2xl font-bold text-brand mb-2">
                Premium Mentor Audit
              </Text>

              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="font-heading text-3xl sm:text-4xl font-extrabold text-text-app tracking-tight">
                  149.000
                </span>
                <span className="font-body text-sm font-medium text-text-muted">
                  VNĐ / lượt
                </span>
              </div>

              {/* Description with fixed min-height for baseline alignment */}
              <p className="font-body text-sm text-text-muted leading-relaxed min-h-[48px] mb-6">
                Dành cho dự án nhắm điểm 8–9, cần chuyên gia rà soát ảo giác và định hướng thực chiến.
              </p>

              {/* Divider */}
              <div className="border-t border-border-app/70 pt-6 mb-8 flex-1">
                <ul className="space-y-3.5 list-none p-0 m-0">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Bao gồm toàn bộ tính năng của Basic AI
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Mentor FPT trực tiếp review và đối chiếu
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Ưu tiên chỉ ra các rủi ro chặn (BLOCKER)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="font-body text-sm text-text-app leading-normal">
                      Định hướng sửa bài thực chiến (SLA: 24h–48h)
                    </span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                component={Link}
                href={`/dashboard/intake?packageId=${PACKAGE_KEYS.SUPPORTER_AUDIT}`}
                fullWidth
                size="md"
                color="blue"
                radius="md"
                className="font-body text-sm font-semibold h-11 transition-all mt-auto"
              >
                Chọn gói Premium
              </Button>
            </div>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
