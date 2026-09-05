"use client";

import { Container, SimpleGrid, Card, Text, Badge, Button, Group, List, ThemeIcon, Title, Box } from "@mantine/core";
import { Check } from "lucide-react";
import Link from "next/link";
import { PACKAGE_KEYS } from "@/lib/pricing";

export default function LandingPricing() {
  return (
    <Box id="pricing" py={80} bg="surface-app" className="transition-colors duration-200">
      <Container size="lg">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <Title order={2} className="font-heading text-3xl md:text-4xl font-bold text-text-app">
            Bảng Giá Dịch Vụ
          </Title>
          <Text className="font-body text-sm text-text-muted max-w-2xl mx-auto leading-relaxed">
            Lựa chọn gói kiểm tra phù hợp với mục tiêu và tiến độ dự án của bạn. 
            Mọi gói đều được xây dựng dựa trên tiêu chuẩn khởi nghiệp thực chiến.
          </Text>
        </div>

        {/* Pricing Cards */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className="max-w-4xl mx-auto items-stretch">
          {/* Basic AI Audit */}
          <Card padding="xl" radius="md" withBorder className="border-border-app bg-surface-card flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="mb-6">
                <Text className="font-heading font-bold text-xl text-text-app mb-2">
                  Basic AI Audit
                </Text>
                <Group align="flex-end" gap="xs">
                  <Text className="text-4xl font-heading font-bold text-text-app">
                    79,000
                  </Text>
                  <Text className="font-body text-sm text-text-muted mb-1">
                    VND / lượt
                  </Text>
                </Group>
                <Text className="font-body text-sm text-text-muted leading-relaxed mt-3 min-h-[44px]">
                  Phù hợp nhóm cần nộp gấp, rà soát khung sườn và sửa lỗi logic cơ bản nhanh chóng.
                </Text>
              </div>

              {/* Checklist */}
              <List
                spacing="md"
                size="sm"
                className="font-body text-text-app mb-8 flex-1"
                icon={
                  <ThemeIcon color="green" size={22} radius="xl" variant="light">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </ThemeIcon>
                }
              >
                <List.Item>Đánh giá hoàn toàn tự động bằng AI</List.Item>
                <List.Item>Phân tích theo Rubric chuẩn (5 tiêu chí cốt lõi)</List.Item>
                <List.Item>Nhận báo cáo chi tiết ngay lập tức (&lt; 1 phút)</List.Item>
                <List.Item>Chỉ ~15,000 VND/bạn (nhóm 5 người)</List.Item>
              </List>
            </div>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`}
              fullWidth
              size="md"
              variant="default"
              radius="md"
              className="font-body font-semibold text-sm h-11 border-border-app text-text-app hover:bg-surface-app"
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
              className="absolute top-5 right-5 font-body font-semibold"
            >
              Phổ biến nhất
            </Badge>

            <div>
              {/* Header */}
              <div className="mb-6">
                <Text className="font-heading font-bold text-xl text-brand mb-2">
                  Premium Mentor Audit
                </Text>
                <Group align="flex-end" gap="xs">
                  <Text className="text-4xl font-heading font-bold text-text-app">
                    149,000
                  </Text>
                  <Text className="font-body text-sm text-text-muted mb-1">
                    VND / lượt
                  </Text>
                </Group>
                <Text className="font-body text-sm text-text-muted leading-relaxed mt-3 min-h-[44px]">
                  Dành cho dự án nhắm điểm 8-9, cần chuyên gia rà soát ảo giác và định hướng thực chiến.
                </Text>
              </div>

              {/* Checklist */}
              <List
                spacing="md"
                size="sm"
                className="font-body text-text-app mb-8 flex-1"
                icon={
                  <ThemeIcon color="blue" size={22} radius="xl" variant="light">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </ThemeIcon>
                }
              >
                <List.Item>Bao gồm toàn bộ tính năng của Basic AI</List.Item>
                <List.Item>Mentor FPT trực tiếp review và đối chiếu</List.Item>
                <List.Item>Ưu tiên chỉ ra các rủi ro chặn (BLOCKER)</List.Item>
                <List.Item>Định hướng sửa bài thực chiến (SLA: 24h-48h)</List.Item>
              </List>
            </div>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.SUPPORTER_AUDIT}`}
              fullWidth
              size="md"
              color="blue"
              radius="md"
              className="font-body font-semibold text-sm h-11"
            >
              Chọn gói Premium
            </Button>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
