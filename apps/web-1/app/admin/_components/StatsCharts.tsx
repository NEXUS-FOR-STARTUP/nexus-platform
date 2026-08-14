"use client";

import React from "react";
import { Paper, Text, SimpleGrid } from "@mantine/core";
import { AreaChart, DonutChart, BarChart } from "@mantine/charts";
import type { AdminStatsResponse } from "../hooks/useAdminStats";

interface StatsChartsProps {
  data: AdminStatsResponse;
}

const STAGE_LABELS: Record<string, string> = {
  intake_pending: "Chờ thông tin",
  intake_ready: "Chờ duyệt",
  submitted: "Đã gửi",
  under_review: "Đang phản biện",
  report_ready: "Báo cáo sẵn sàng",
  waiting_for_revision: "Chờ sửa đổi",
  revision_submitted: "Đã sửa đổi",
  completed: "Hoàn thành",
  rejected: "Từ chối",
  closed: "Đã đóng",
};

const DONUT_PALETTE = [
  { mantine: "blue.6", hex: "#2563eb" },
  { mantine: "cyan.6", hex: "#0891b2" },
  { mantine: "teal.6", hex: "#0d9488" },
  { mantine: "indigo.6", hex: "#4f46e5" },
  { mantine: "violet.6", hex: "#7c3aed" },
  { mantine: "orange.6", hex: "#ea580c" },
  { mantine: "yellow.6", hex: "#ca8a04" },
  { mantine: "red.6", hex: "#dc2626" },
  { mantine: "gray.6", hex: "#64748b" },
];

export default function StatsCharts({ data }: StatsChartsProps) {
  // Revenue AreaChart Data
  const revenueTrendData = (data.revenueTrend || []).map((r) => ({
    label: r.label,
    "Doanh thu": r.revenue,
  }));

  const areaChartData =
    revenueTrendData.length > 0
      ? revenueTrendData
      : (data.revenueByMonth || []).map((r) => ({
          label: r.month,
          "Doanh thu": r.revenue,
        }));

  // Case Trend BarChart Data
  const caseTrendData = (data.caseTrend || []).map((c) => ({
    label: c.label,
    "Hồ sơ Miễn phí": c.free,
    "Hồ sơ Trả phí": c.paid,
  }));

  // Donut Chart Data
  const donutData = Object.entries(data.casesByStage || {})
    .filter(([, count]) => count > 0)
    .map(([stage, count], idx) => {
      const palette = DONUT_PALETTE[idx % DONUT_PALETTE.length];
      return {
        name: STAGE_LABELS[stage] || stage,
        value: count,
        color: palette.mantine,
        hex: palette.hex,
      };
    });

  // Supporter workload bar chart
  const barData = (data.supporterWorkload || []).map((s) => ({
    supporter: s.name,
    "Số case": s.caseCount,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Revenue AreaChart + Stage DonutChart */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
        <Paper
          p="md"
          radius="md"
          withBorder
          className="border-border-app bg-surface-app lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <Text size="sm" fw={600} className="font-heading text-text-app">
              Doanh thu
            </Text>
            <Text size="xs" c="dimmed">
              VND
            </Text>
          </div>
          {areaChartData.length > 0 ? (
            <AreaChart
              h={260}
              data={areaChartData}
              dataKey="label"
              series={[{ name: "Doanh thu", color: "blue.6" }]}
              valueFormatter={(value) =>
                `${Number(value).toLocaleString("en-US")} VND`
              }
              curveType="monotone"
              tickLine="xy"
              gridAxis="xy"
              withDots={false}
              activeDotProps={{ r: 5, strokeWidth: 2 }}
            />
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có dữ liệu giao dịch
            </Text>
          )}
        </Paper>

        <Paper
          p="md"
          radius="md"
          withBorder
          className="border-border-app bg-surface-app flex flex-col justify-between"
        >
          <Text size="sm" fw={600} className="font-heading text-text-app mb-4">
            Trạng thái hồ sơ
          </Text>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center justify-center flex-grow py-2">
              <DonutChart
                h={180}
                data={donutData}
                withTooltip
                chartLabel={`${data.totalCases} hồ sơ`}
                size={160}
                thickness={20}
              />
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto">
                {donutData.map((item) => (
                  <span
                    key={item.name}
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted px-2 py-0.5 rounded-full bg-surface-soft border border-border-app"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.hex }}
                    />
                    <span>{item.name}</span>
                    <span className="font-semibold text-text-app">({item.value})</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có hồ sơ trong hệ thống
            </Text>
          )}
        </Paper>
      </SimpleGrid>

      {/* Row 2: Case Growth BarChart + Supporter Workload BarChart */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper
          p="md"
          radius="md"
          withBorder
          className="border-border-app bg-surface-app"
        >
          <Text size="sm" fw={600} className="font-heading text-text-app mb-4">
            Tiếp nhận hồ sơ
          </Text>
          {caseTrendData.length > 0 ? (
            <BarChart
              h={240}
              data={caseTrendData}
              dataKey="label"
              type="stacked"
              series={[
                { name: "Hồ sơ Miễn phí", color: "blue.3" },
                { name: "Hồ sơ Trả phí", color: "blue.7" },
              ]}
              tickLine="xy"
              gridAxis="xy"
            />
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có dữ liệu hồ sơ
            </Text>
          )}
        </Paper>

        <Paper
          p="md"
          radius="md"
          withBorder
          className="border-border-app bg-surface-app"
        >
          <Text size="sm" fw={600} className="font-heading text-text-app mb-4">
            Phân bổ Supporter
          </Text>
          {barData.length > 0 ? (
            <BarChart
              h={240}
              data={barData}
              dataKey="supporter"
              series={[{ name: "Số case", color: "teal.6" }]}
              tickLine="xy"
              gridAxis="xy"
            />
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có Supporter được phân công
            </Text>
          )}
        </Paper>
      </SimpleGrid>
    </div>
  );
}
