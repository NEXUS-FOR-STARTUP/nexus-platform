"use client";

import React from "react";
import Link from "next/link";
import { Title, Text, Button, Container, List, ThemeIcon } from "@mantine/core";
import { ArrowRight, Check } from "lucide-react";
import classes from "./HeroBullets.module.css";

export default function LandingHero() {
  // Pricing state removed as LandingPricing component handles generic prices

  return (
    <section className="relative overflow-hidden bg-bg-app transition-colors duration-200">
      {/* Decorative background grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 dark:opacity-10" />

      <Container size="lg">
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>
              Đánh giá và phản biện <br />
              <span className={classes.highlight}>dự án khởi nghiệp</span>
            </Title>
            
            <Text c="dimmed" mt="md" className="font-body leading-relaxed">
              Nexus đưa dự án của nhóm bạn qua quy trình đánh giá có cấu trúc — phát hiện điểm thiếu logic, nhận diện các giả định chưa kiểm chứng và gợi ý hướng hoàn thiện trước khi trình bày.
            </Text>

            <List
              mt={30}
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon size={20} radius="xl" variant="light" color="blue">
                  <Check className="w-3.5 h-3.5 text-brand" />
                </ThemeIcon>
              }
              className="font-body text-text-muted"
            >
              <List.Item>
                <b>Đánh giá có cấu trúc</b> – Báo cáo chi tiết chỉ ra các lỗ hổng lập luận và khoảng trống dữ liệu.
              </List.Item>
              <List.Item>
                <b>Định vị minh chứng</b> – Đối chiếu trực tiếp nhận xét với các phần nội dung liên quan trong tài liệu.
              </List.Item>
              <List.Item>
                <b>Ưu tiên hành động</b> – Phân loại rõ vấn đề cần xử lý trước và các gợi ý hoàn thiện thêm.
              </List.Item>
            </List>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                component={Link}
                href="/dashboard/team-fit"
                size="lg"
                color="brand"
                radius="md"
                data-cta="free"
                rightSection={<ArrowRight className="w-4 h-4 shrink-0" />}
                className="w-full sm:w-auto font-semibold font-body shadow-md shadow-brand/10 transition-transform hover:-translate-y-0.5 justify-center"
              >
                Kiểm tra nhanh ý tưởng
              </Button>
              <Button
                component="a"
                href="#pricing"
                size="lg"
                variant="outline"
                radius="md"
                data-cta="paid"
                className="w-full sm:w-auto font-semibold font-body border-border-strong justify-center"
              >
                Xem bảng giá
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
