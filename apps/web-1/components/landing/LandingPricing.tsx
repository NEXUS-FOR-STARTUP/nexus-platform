"use client";

import { Container, SimpleGrid, Card, Badge, Button, Box } from "@mantine/core";
import { Check } from "lucide-react";
import Link from "next/link";
import { PACKAGE_KEYS } from "@/lib/pricing";

export default function LandingPricing() {
  return (
    <Box id="pricing" py={80} bg="surface-app">
      <Container size="lg">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-app mb-4">
            Bảng Giá Dịch Vụ
          </h2>
          <p className="font-body text-text-muted text-[15px] max-w-2xl mx-auto leading-relaxed">
            Lựa chọn gói kiểm tra phù hợp với mục tiêu và tiến độ dự án của bạn. 
            Mọi gói đều được xây dựng dựa trên tiêu chuẩn khởi nghiệp thực chiến.
          </p>
        </div>

        {/* Pricing Cards */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className="max-w-4xl mx-auto items-stretch">
          {/* Basic AI Audit */}
          <Card padding="xl" radius="md" withBorder className="border-border-app bg-surface-card flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="mb-5">
                <h3 className="font-heading font-bold text-[20px] text-text-app mb-1.5">
                  Basic AI Audit
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading font-extrabold text-[36px] text-text-app tracking-tight leading-none">
                    79.000
                  </span>
                  <span className="font-body font-medium text-[13px] text-text-muted">
                    VNĐ / lượt
                  </span>
                </div>
                <p className="font-body text-[13.5px] text-text-muted leading-relaxed mt-2.5 mb-5 min-h-[44px]">
                  Phù hợp cho các nhóm cần nộp bài gấp, rà soát khung sườn và sửa các lỗi logic cơ bản nhanh chóng.
                </p>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 mb-8 flex-1">
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-green-500/15 text-green-600 dark:text-green-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Đánh giá hoàn toàn tự động bằng AI</span>
                </li>
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-green-500/15 text-green-600 dark:text-green-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Phân tích theo Rubric chuẩn (5 tiêu chí cốt lõi)</span>
                </li>
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-green-500/15 text-green-600 dark:text-green-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Nhận báo cáo chi tiết ngay lập tức (&lt; 1 phút)</span>
                </li>
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-green-500/15 text-green-600 dark:text-green-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Chỉ ~15.000đ/bạn khi chia theo nhóm 5 người</span>
                </li>
              </ul>
            </div>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`}
              fullWidth
              size="md"
              variant="default"
              radius="md"
              className="font-body font-semibold text-[14px] h-11 border-border-app text-text-app hover:bg-surface-app"
            >
              Bắt đầu kiểm tra
            </Button>
          </Card>

          {/* Premium Mentor Audit */}
          <Card padding="xl" radius="md" withBorder className="border-brand/40 bg-surface-card flex flex-col justify-between relative">
            <Badge 
              variant="filled" 
              color="blue" 
              size="md" 
              className="absolute top-5 right-5 font-semibold text-[11px]"
            >
              Phổ biến nhất
            </Badge>

            <div>
              {/* Header */}
              <div className="mb-5">
                <h3 className="font-heading font-bold text-[20px] text-brand mb-1.5">
                  Premium Mentor Audit
                </h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading font-extrabold text-[36px] text-text-app tracking-tight leading-none">
                    149.000
                  </span>
                  <span className="font-body font-medium text-[13px] text-text-muted">
                    VNĐ / lượt
                  </span>
                </div>
                <p className="font-body text-[13.5px] text-text-muted leading-relaxed mt-2.5 mb-5 min-h-[44px]">
                  Dành cho dự án nhắm điểm 8-9, cần chuyên gia rà soát ảo giác và định hướng thực chiến.
                </p>
              </div>

              {/* Checklist */}
              <ul className="space-y-2.5 mb-8 flex-1">
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Bao gồm toàn bộ tính năng của Basic AI</span>
                </li>
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Mentor FPT trực tiếp review và đối chiếu</span>
                </li>
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Ưu tiên chỉ ra các rủi ro chặn (BLOCKER)</span>
                </li>
                <li className="flex items-center gap-2.5 font-body text-[13px] text-text-app">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>Định hướng sửa bài thực chiến (SLA: 24h-48h)</span>
                </li>
              </ul>
            </div>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.SUPPORTER_AUDIT}`}
              fullWidth
              size="md"
              color="blue"
              radius="md"
              className="font-body font-semibold text-[14px] h-11"
            >
              Chọn gói Premium
            </Button>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
