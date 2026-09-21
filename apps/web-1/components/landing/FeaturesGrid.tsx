"use client";

import React from "react";
import { Container, Title, Text, SimpleGrid, Card, ThemeIcon } from "@mantine/core";
import { Cpu, Users, History, CheckCircle } from "lucide-react";

const featuresData = [
  {
    title: "Phát hiện lỗ hổng lập luận",
    description: "Chỉ ra các khẳng định thiếu căn cứ, mâu thuẫn giữa vấn đề và giải pháp đề xuất trong tài liệu.",
    icon: Cpu,
    color: "blue",
  },
  {
    title: "Định vị theo tài liệu",
    description: "Trích dẫn vị trí cụ thể trong tài liệu nộp để nhóm biết chính xác nội dung nào cần chỉnh sửa.",
    icon: Users,
    color: "teal",
  },
  {
    title: "Quản lý theo phiên bản",
    description: "Lưu trữ lịch sử từng lần đánh giá (Phiên bản 1, 2, 3...) giúp nhóm theo dõi tiến độ hoàn thiện dự án.",
    icon: History,
    color: "indigo",
  },
  {
    title: "5 nhóm tiêu chí đánh giá",
    description: "Đánh giá dự án qua 5 nhóm tiêu chí về vấn đề, thị trường, mô hình kinh doanh, lợi thế cạnh tranh và khả năng triển khai.",
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
            Quy trình đánh giá của Nexus
          </Title>
          <Text className="font-body text-text-muted">
            Tập trung kiểm tra tính hợp lý, bằng chứng thực tế và mức độ sẵn sàng của dự án.
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
                className="bg-surface-app border-border-app hover:border-brand/40 transition-all"
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
