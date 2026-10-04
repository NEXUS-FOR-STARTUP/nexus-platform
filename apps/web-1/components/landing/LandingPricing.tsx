"use client";

import { Container, Card, Badge, Button, List, ThemeIcon, Box } from "@mantine/core";
import { Check } from "lucide-react";
import Link from "next/link";
import { PACKAGE_KEYS } from "@/lib/pricing";

export default function LandingPricing() {
  return (
    <Box id="pricing" py={80} bg="surface-app" className="transition-colors duration-200">
      <Container size="lg">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-app">
            Bảng Giá Dịch Vụ
          </h2>
          <p className="font-body text-sm text-text-muted max-w-2xl mx-auto leading-relaxed">
            Chi phí minh bạch, tính theo gói đánh giá tài liệu cho cả nhóm.
          </p>
        </div>

        {/* Pricing Card (Core 79k Package - Centered) */}
        <div className="max-w-md mx-auto">
          <Card padding="xl" radius="md" withBorder className="border-brand/40 bg-surface-card flex flex-col justify-between relative">
            <Badge 
              variant="filled" 
              color="blue" 
              size="md" 
              className="absolute top-5 right-5 font-body font-semibold"
            >
              Khuyên dùng
            </Badge>
            <div>
              {/* Header */}
              <div className="mb-6">
                <h3 className="font-heading font-bold text-xl text-text-app mb-2">
                  Đánh giá Dự án Tự động
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-heading font-bold text-text-app">
                    79.000đ
                  </span>
                  <span className="font-body text-sm text-text-muted">
                    / Bao gồm 2 lượt đánh giá
                  </span>
                </div>
                <p className="font-body text-sm text-text-muted leading-relaxed mt-3 min-h-[44px]">
                  Phù hợp cho nhóm cần rà soát tài liệu, nhận diện điểm yếu và đánh giá lại sau khi chỉnh sửa.
                </p>
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
                <List.Item>2 lượt đánh giá tài liệu độc lập</List.Item>
                <List.Item>Đánh giá theo 5 nhóm tiêu chí cốt lõi</List.Item>
                <List.Item>Phân loại vấn đề theo mức độ ưu tiên xử lý</List.Item>
                <List.Item>Kết quả thường có sau khoảng 10 phút</List.Item>
                <List.Item>Chỉ ~16.000đ/thành viên (nhóm 5 người)</List.Item>
              </List>
            </div>

            <Button
              component={Link}
              href={`/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`}
              fullWidth
              size="md"
              color="blue"
              radius="md"
              className="font-body font-semibold text-sm h-11 mt-8"
            >
              Bắt đầu đánh giá
            </Button>
          </Card>
        </div>
      </Container>
    </Box>
  );
}
