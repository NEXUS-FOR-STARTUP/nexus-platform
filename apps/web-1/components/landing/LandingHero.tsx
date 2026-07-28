"use client";

import React from "react";
import Link from "next/link";
import { Title, Text, Button, Container, Stack, Group, List, ThemeIcon } from "@mantine/core";
import { ArrowRight, Check } from "lucide-react";
import classes from "./HeroBullets.module.css";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-bg-app transition-colors duration-200">
      {/* Decorative background grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 dark:opacity-10" />

      <Container size="lg">
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>
              Kiểm định Ý tưởng & Đánh giá <br />
              <span className={classes.highlight}>Checkpoint 1</span>
            </Title>
            
            <Text c="dimmed" mt="md" className="font-body leading-relaxed">
              Nexus giúp các nhóm sinh viên kiểm định nội dung Checkpoint 1 (CP1) theo đúng tiêu chí chấm điểm học thuật, phát hiện lỗi logic lập luận bằng AI và nhận phản biện thực tế từ Supporter giàu kinh nghiệm.
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
                <b>Đánh giá tiêu chí Checkpoint</b> – Báo cáo chi tiết chỉ ra lỗ hổng lập luận và lỗi logic.
              </List.Item>
              <List.Item>
                <b>Minh chứng thuyết phục</b> – Định vị bằng chứng cụ thể trong slide/tài liệu của bạn.
              </List.Item>
              <List.Item>
                <b>Đồng hành cùng Supporter</b> – Báo cáo được chỉnh sửa, hoàn thiện bởi giảng viên/mentor.
              </List.Item>
            </List>

            <Stack mt={30} className="w-full sm:w-auto">
              <Group>
                <Button
                  component={Link}
                  href="/dashboard/team-fit"
                  size="lg"
                  color="brand"
                  radius="md"
                  data-cta="free"
                  rightSection={<ArrowRight className="w-4 h-4" />}
                  className={`${classes.control} font-semibold font-body shadow-md shadow-brand/10 transition-transform hover:-translate-y-0.5`}
                >
                  Kiểm tra miễn phí
                </Button>
                <Button
                  component={Link}
                  href="/dashboard/intake?packageId=pkg_tf_audit"
                  size="lg"
                  variant="outline"
                  radius="md"
                  data-cta="paid"
                  className={`${classes.control} font-semibold font-body border-border-strong`}
                >
                  Mua kiểm tra chuyên sâu
                </Button>
              </Group>
              <Text size="xs" c="dimmed">39.000đ / lượt</Text>
            </Stack>
          </div>
        </div>
      </Container>
    </section>
  );
}
