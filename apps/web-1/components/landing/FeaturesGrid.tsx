"use client";

import React from "react";
import { Container, Title, Text, SimpleGrid, Card, ThemeIcon } from "@mantine/core";
import { Cpu, Users, History, CheckCircle } from "lucide-react";

const featuresData = [
  {
    title: "Phản biện thông minh (AI)",
    description: "Phân tích tài liệu slide, đề cương để chỉ ra các điểm thiếu logic và khuyến nghị bổ sung chi tiết.",
    icon: Cpu,
    color: "blue",
  },
  {
    title: "Mở rộng góc nhìn thực tế",
    description: "Các Supporter giàu kinh nghiệm sẽ bổ sung góc nhìn thực tiễn và tinh chỉnh kết quả phản biện.",
    icon: Users,
    color: "teal",
  },
  {
    title: "Theo dõi phiên bản",
    description: "Lưu trữ lịch sử nộp bài (v0, v1, v2...) giúp bạn dễ dàng theo dõi tiến độ sửa đổi hồ sơ.",
    icon: History,
    color: "indigo",
  },
  {
    title: "Chuẩn tiêu chí Checkpoint",
    description: "Bộ tiêu chí bám sát syllabus học thuật, giúp giảm thiểu rủi ro khi bảo vệ trước hội đồng.",
    icon: CheckCircle,
    color: "green",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-soft/20 transition-colors duration-200">
      <Container size="lg" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Title order={2} className="font-heading text-3xl font-bold text-text-app">
            Tính năng cốt lõi của Nexus
          </Title>
          <Text className="font-body text-text-muted">
            Đồng hành cùng ý tưởng của bạn từ lúc sơ khởi đến khi bảo vệ thành công trước hội đồng.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {featuresData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                p="lg"
                radius="lg"
                withBorder
                className="bg-surface-app border-border-app hover:border-brand/40 shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <ThemeIcon color={item.color} size={40} radius="md" variant="light">
                    <Icon className="w-5 h-5" />
                  </ThemeIcon>
                  <div className="space-y-1">
                    <Text className="font-heading font-semibold text-sm text-text-app">
                      {item.title}
                    </Text>
                    <Text className="font-body text-xs text-text-muted leading-relaxed">
                      {item.description}
                    </Text>
                  </div>
                </div>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </section>
  );
}
