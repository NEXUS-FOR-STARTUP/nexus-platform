"use client";

import React from "react";
import { Paper, Text, SimpleGrid } from "@mantine/core";
import type { AdminStatsResponse } from "../hooks/useAdminStats";

interface StatsKpiCardsProps {
  data: AdminStatsResponse;
}

export default function StatsKpiCards({ data }: StatsKpiCardsProps) {
  const cards = [
    {
      label: "Tổng hồ sơ",
      value: data.totalCases.toLocaleString("en-US"),
      detail: `${data.freeCases} miễn phí · ${data.paidCases} trả phí`,
    },
    {
      label: "Tỷ lệ chuyển đổi",
      value: `${data.conversionRate}%`,
      detail: "Hồ sơ chuyển sang trả phí",
    },
    {
      label: "Doanh thu",
      value: `${data.totalRevenue.toLocaleString("en-US")} VND`,
      detail: "Tổng doanh thu tích luỹ",
    },
    {
      label: "Quá hạn SLA",
      value: data.slaBreachCount,
      detail: data.slaBreachCount > 0 ? "Cần phân công lại" : "0 hồ sơ quá hạn",
      isAlert: data.slaBreachCount > 0,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
      {cards.map((card) => (
        <Paper
          key={card.label}
          p="md"
          radius="md"
          withBorder
          className="border-border-app bg-surface-app"
        >
          <Text size="xs" c="dimmed" fw={500} className="font-body">
            {card.label}
          </Text>
          <Text
            size="xl"
            fw={700}
            className={`font-heading mt-1 ${
              card.isAlert ? "text-danger" : "text-text-app"
            }`}
          >
            {card.value}
          </Text>
          <Text size="xs" c="dimmed" className="font-body mt-1">
            {card.detail}
          </Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
