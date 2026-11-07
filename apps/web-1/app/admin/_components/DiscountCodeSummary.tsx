"use client";

import { Card, SimpleGrid, Text } from "@mantine/core";
import type { AdminDiscountCodeSummary } from "@repo/validation";

const PERCENT = 100;

export default function DiscountCodeSummary({ summary }: { summary: AdminDiscountCodeSummary | null }) {
  if (!summary) return null;
  const conversion = summary.personal_granted > 0 ? Math.round((summary.personal_redeemed / summary.personal_granted) * PERCENT) : null;
  const stats = [
    { label: "Tổng số mã", value: summary.total },
    { label: "Đang hiệu lực", value: summary.available },
    { label: "Đã dùng hết", value: summary.used },
    { label: "Hết hạn", value: summary.expired },
    { label: "Đã tắt", value: summary.disabled },
    {
      label: "Mã tặng đã dùng",
      value: conversion === null ? "—" : `${summary.personal_redeemed}/${summary.personal_granted} (${conversion}%)`,
    },
  ];
  return (
    <SimpleGrid cols={{ base: 2, md: 6 }} spacing="sm">
      {stats.map((stat) => (
        <Card key={stat.label} withBorder padding="sm" radius="md">
          <Text size="xs" c="dimmed">{stat.label}</Text>
          <Text fw={700} size="lg">{stat.value}</Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
