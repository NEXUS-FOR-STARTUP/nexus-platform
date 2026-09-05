"use client";

import { Container, SimpleGrid, Card, Text, Badge, Button, Group, List, ThemeIcon, Title, Box } from "@mantine/core";
import { Check } from "lucide-react";
import Link from "next/link";
import { PACKAGE_KEYS } from "@/lib/pricing";

export default function LandingPricing() {
  return (
    <Box id="pricing" py={80} bg="surface-app">
      <Container size="lg">
        <div className="text-center mb-12">
          <Title order={2} className="text-3xl md:text-4xl font-display text-text-app mb-4">
            Bảng Giá Dịch Vụ
          </Title>
          <Text c="dimmed" className="font-body max-w-2xl mx-auto">
            Lựa chọn gói kiểm tra phù hợp với mục tiêu và tiến độ dự án của bạn. 
            Mọi gói đều được xây dựng dựa trên tiêu chuẩn khởi nghiệp thực chiến.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className="max-w-4xl mx-auto">
          {/* Basic AI Audit */}
          <Card padding="xl" radius="md" withBorder className="border-border-app bg-surface-card flex flex-col">
            <div className="mb-6">
              <Text className="font-display font-semibold text-lg text-text-app mb-2">Basic AI Audit</Text>
              <Group align="flex-end" gap="xs">
                <Text className="text-4xl font-display font-bold text-text-app">79.000</Text>
                <Text className="font-body text-text-muted mb-1">VNĐ / lượt</Text>
              </Group>
              <Text size="sm" c="dimmed" mt="sm" className="font-body h-10">
                Phù hợp cho các nhóm cần nộp bài gấp, rà soát khung sườn và sửa các lỗi logic cơ bản nhanh chóng.
              </Text>
            </div>

            <List
              spacing="sm"
              size="sm"
              className="font-body mb-8 flex-1"
              icon={
                <ThemeIcon color="green" size={24} radius="xl" variant="light">
                  <Check size={14} strokeWidth={3} />
                </ThemeIcon>
              }
            >
              <List.Item>Đánh giá hoàn toàn tự động bằng AI</List.Item>
              <List.Item>Phân tích theo Rubric chuẩn (5 tiêu chí cốt lõi)</List.Item>
              <List.Item>Nhận báo cáo chi tiết ngay lập tức (dưới 1 phút)</List.Item>
              <List.Item>Chỉ ~15.000đ/bạn khi chia theo nhóm 5 người</List.Item>
            </List>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`}
              fullWidth
              size="md"
              variant="default"
              radius="md"
              className="font-body font-semibold border-border-app text-text-app hover:bg-surface-app"
            >
              Bắt đầu kiểm tra
            </Button>
          </Card>

          {/* Premium Mentor Audit */}
          <Card padding="xl" radius="md" withBorder className="border-brand/40 bg-surface-card flex flex-col relative">
            <Badge 
              variant="filled" 
              color="blue" 
              size="lg" 
              className="absolute top-4 right-4"
            >
              Phổ biến nhất
            </Badge>

            <div className="mb-6">
              <Text className="font-display font-semibold text-lg text-brand mb-2">Premium Mentor Audit</Text>
              <Group align="flex-end" gap="xs">
                <Text className="text-4xl font-display font-bold text-text-app">149.000</Text>
                <Text className="font-body text-text-muted mb-1">VNĐ / lượt</Text>
              </Group>
              <Text size="sm" c="dimmed" mt="sm" className="font-body h-10">
                Dành cho dự án nhắm điểm 8-9, cần chuyên gia rà soát ảo giác và định hướng thực chiến.
              </Text>
            </div>

            <List
              spacing="sm"
              size="sm"
              className="font-body mb-8 flex-1"
              icon={
                <ThemeIcon color="blue" size={24} radius="xl" variant="light">
                  <Check size={14} strokeWidth={3} />
                </ThemeIcon>
              }
            >
              <List.Item>Bao gồm toàn bộ tính năng của Basic AI</List.Item>
              <List.Item>Mentor FPT trực tiếp review và đối chiếu</List.Item>
              <List.Item>Ưu tiên chỉ ra các rủi ro chặn (BLOCKER)</List.Item>
              <List.Item>Định hướng sửa bài thực chiến (SLA: 24h-48h)</List.Item>
            </List>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.SUPPORTER_AUDIT}`}
              fullWidth
              size="md"
              color="blue"
              radius="md"
              className="font-body font-semibold"
            >
              Chọn gói Premium
            </Button>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}