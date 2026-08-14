"use client";

import React from "react";
import { Text, Select } from "@mantine/core";
import StatsKpiCards from "./StatsKpiCards";
import StatsCharts from "./StatsCharts";
import type { AdminStatsResponse } from "../hooks/useAdminStats";

interface StatsDashboardProps {
  data: AdminStatsResponse | undefined;
  isLoading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

const PERIOD_OPTIONS = [
  { label: "7 ngày qua", value: "7d" },
  { label: "30 ngày qua", value: "30d" },
  { label: "12 tháng qua", value: "month" },
  { label: "Theo học kỳ", value: "semester" },
  { label: "Theo quý", value: "quarter" },
  { label: "Theo năm", value: "year" },
];

export default function StatsDashboard({
  data,
  isLoading,
  period,
  onPeriodChange,
}: StatsDashboardProps) {
  if (isLoading || !data) {
    return (
      <Text size="sm" c="dimmed" className="p-8 text-center font-body">
        Đang tải dữ liệu thống kê...
      </Text>
    );
  }

  return (
    <div className="space-y-6 font-body text-xs text-text-app">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between">
        <Text size="sm" fw={600} className="font-heading text-text-app">
          Chỉ số hoạt động
        </Text>
        <Select
          size="xs"
          radius="md"
          value={period}
          onChange={(val) => val && onPeriodChange(val)}
          data={PERIOD_OPTIONS}
          allowDeselect={false}
          w={160}
          className="font-body"
        />
      </div>

      {/* 4 KPI Cards */}
      <StatsKpiCards data={data} />

      {/* 4 Clean Charts */}
      <StatsCharts data={data} />
    </div>
  );
}
