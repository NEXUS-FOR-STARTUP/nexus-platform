"use client";
import React from "react";
import { Paper, Group, Text, SimpleGrid, SegmentedControl, Badge } from "@mantine/core";
import { AreaChart, DonutChart, BarChart } from "@mantine/charts";
import { FileText, TrendingUp, DollarSign, AlertTriangle, Calendar, Layers, Activity } from "lucide-react";
import type { AdminStatsResponse } from "../hooks/useAdminStats";

interface StatsDashboardProps {
  data: AdminStatsResponse | undefined;
  isLoading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

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

  // 4 Stat Cards
  const cards = [
    {
      label: "Tổng hồ sơ",
      value: data.totalCases,
      icon: FileText,
      color: "var(--color-brand)",
      valueClass: "text-brand",
      detail: `${data.freeCases} miễn phí / ${data.paidCases} trả phí`,
    },
    {
      label: "Tỷ lệ chuyển đổi",
      value: `${data.conversionRate}%`,
      icon: TrendingUp,
      color: "#14b8a6",
      valueClass: "text-teal-500",
      detail: "Free → Paid Audit",
    },
    {
      label: "Tổng doanh thu",
      value: `${data.totalRevenue.toLocaleString("vi-VN")} VNĐ`,
      icon: DollarSign,
      color: "#22c55e",
      valueClass: "text-green-500",
      detail: "Doanh thu tích lũy hệ thống",
    },
    {
      label: "SLA quá hạn",
      value: data.slaBreachCount,
      icon: AlertTriangle,
      color: data.slaBreachCount > 0 ? "#ef4444" : "#22c55e",
      valueClass: data.slaBreachCount > 0 ? "text-red-500" : "text-green-500",
      detail: data.slaBreachCount > 0 ? "Cần xử lý ngay" : "Trong thời hạn SLA",
    },
  ];

  // 1. Revenue AreaChart Data (with zero-filling support)
  const revenueTrendData = (data.revenueTrend || []).map((r) => ({
    label: r.label,
    "Doanh thu": r.revenue,
    "Số giao dịch": r.transactions,
  }));

  // Fallback for revenueTrend if empty
  const areaChartData =
    revenueTrendData.length > 0
      ? revenueTrendData
      : (data.revenueByMonth || []).map((r) => ({
          label: r.month,
          "Doanh thu": r.revenue,
          "Số giao dịch": 1,
        }));

  // 2. Case Trend BarChart Data (Free vs Paid over timeframe)
  const caseTrendData = (data.caseTrend || []).map((c) => ({
    label: c.label,
    "Hồ sơ Miễn phí": c.free,
    "Hồ sơ Trả phí": c.paid,
  }));

  // 3. Stage distribution donut chart labels
  const stageLabels: Record<string, string> = {
    submitted: "Đã gửi",
    under_review: "Đang phản biện",
    report_ready: "Báo cáo sẵn sàng",
    waiting_for_revision: "Chờ sửa đổi",
    revision_submitted: "Đã sửa đổi",
    completed: "Hoàn thành",
    rejected: "Từ chối",
    closed: "Đã đóng",
  };

  const donutColors = [
    "blue.6",
    "violet.6",
    "cyan.6",
    "orange.6",
    "yellow.6",
    "teal.6",
    "red.6",
    "gray.6",
  ];
  const donutData = Object.entries(data.casesByStage || {}).map(
    ([stage, count], idx) => ({
      name: stageLabels[stage] || stage,
      value: count,
      color: donutColors[idx % donutColors.length],
    }),
  );

  // 4. Supporter workload bar chart
  const barData = (data.supporterWorkload || []).map((s) => ({
    supporter: s.name,
    "Số case": s.caseCount,
  }));

  return (
    <div className="space-y-6 font-body text-xs text-text-app">
      {/* Top Filter Control Bar */}
      <div className="bg-surface-app border border-border-app p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand" />
          <span className="font-heading font-semibold text-sm text-text-app">Mốc thời gian thống kê:</span>
          <Badge variant="light" color="brand" size="md">
            {period === "7d"
              ? "7 Ngày gần nhất"
              : period === "30d"
              ? "30 Ngày gần nhất"
              : period === "month"
              ? "Theo Tháng (12 tháng)"
              : period === "semester"
              ? "Theo Học Kỳ (Spring/Summer/Fall)"
              : period === "quarter"
              ? "Theo Quý (Q1-Q4)"
              : "Theo Năm"}
          </Badge>
        </div>

        <SegmentedControl
          value={period}
          onChange={onPeriodChange}
          data={[
            { label: "7 Ngày", value: "7d" },
            { label: "30 Ngày", value: "30d" },
            { label: "Theo Tháng", value: "month" },
            { label: "Theo Học Kỳ", value: "semester" },
            { label: "Theo Quý", value: "quarter" },
            { label: "Theo Năm", value: "year" },
          ]}
          size="xs"
          radius="md"
          color="brand"
          className="bg-surface-soft border border-border-app"
        />
      </div>

      {/* 4 Stat Cards */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        {cards.map((card) => (
          <Paper
            key={card.label}
            p="md"
            radius="md"
            withBorder
            className="border-border-app bg-surface-app shadow-xs"
          >
            <Group gap="xs" mb={4}>
              <card.icon className="w-4.5 h-4.5" style={{ color: card.color }} />
              <Text size="sm" c="dimmed" className="font-body font-medium">
                {card.label}
              </Text>
            </Group>
            <Text size="xl" fw={700} className={`font-heading ${card.valueClass}`}>
              {card.value}
            </Text>
            <Text size="xs" c="dimmed" className="font-body mt-1">
              {card.detail}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Row 1: Revenue Line/AreaChart + Stage DonutChart */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
        <Paper p="md" radius="md" withBorder className="border-border-app bg-surface-app lg:col-span-2 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-brand" />
              <Text size="md" fw={700} className="font-heading text-h4 text-text-app">
                Xu hướng Doanh thu theo thời gian
              </Text>
            </div>
            <Text size="sm" c="dimmed">
              (Đơn vị: VNĐ)
            </Text>
          </div>
          {areaChartData.length > 0 ? (
            <AreaChart
              h={280}
              data={areaChartData}
              dataKey="label"
              series={[{ name: "Doanh thu", color: "blue.6" }]}
              valueFormatter={(value) => `${Number(value).toLocaleString("vi-VN")} VNĐ`}
              curveType="monotone"
              tickLine="xy"
              gridAxis="xy"
              withDots
              dotProps={{ r: 4, strokeWidth: 2 }}
              activeDotProps={{ r: 6, strokeWidth: 3 }}
            />
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có dữ liệu giao dịch trong khoảng thời gian này
            </Text>
          )}
        </Paper>

        <Paper p="md" radius="md" withBorder className="border-border-app bg-surface-app shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4.5 h-4.5 text-brand" />
            <Text size="md" fw={700} className="font-heading text-h4 text-text-app">
              Phân bố trạng thái hồ sơ
            </Text>
          </div>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center justify-center">
              <DonutChart
                h={240}
                data={donutData}
                withLabels
                withTooltip
                withLabelsLine
              />
            </div>
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có hồ sơ nào trong hệ thống
            </Text>
          )}
        </Paper>
      </SimpleGrid>

      {/* Row 2: Case Growth BarChart + Supporter Workload BarChart */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="md" radius="md" withBorder className="border-border-app bg-surface-app shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4.5 h-4.5 text-brand" />
            <Text size="md" fw={700} className="font-heading text-h4 text-text-app">
              Tốc độ tiếp nhận hồ sơ mới (Miễn phí vs Trả phí)
            </Text>
          </div>
          {caseTrendData.length > 0 ? (
            <BarChart
              h={250}
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
              Chưa có dữ liệu hồ sơ mới
            </Text>
          )}
        </Paper>

        <Paper p="md" radius="md" withBorder className="border-border-app bg-surface-app shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4.5 h-4.5 text-brand" />
            <Text size="md" fw={700} className="font-heading text-h4 text-text-app">
              Khối lượng công việc Supporter chuyên môn
            </Text>
          </div>
          {barData.length > 0 ? (
            <BarChart
              h={250}
              data={barData}
              dataKey="supporter"
              series={[{ name: "Số case", color: "teal.6" }]}
              tickLine="xy"
              gridAxis="xy"
            />
          ) : (
            <Text size="xs" c="dimmed" className="py-12 text-center">
              Chưa có Supporter nào được phân công hồ sơ
            </Text>
          )}
        </Paper>
      </SimpleGrid>
    </div>
  );
}
