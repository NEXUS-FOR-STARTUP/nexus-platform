"use client";

import { Paper, Text, SimpleGrid, Badge, Group } from "@mantine/core";
import { Activity, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AdminWorkerStats } from "../hooks/useAdminWorkers";

interface WorkerKpiCardsProps {
  data?: AdminWorkerStats;
  isLoading?: boolean;
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  return `${minutes}m ${remainingSec}s`;
}

export default function WorkerKpiCards({ data, isLoading }: WorkerKpiCardsProps) {
  const active = data?.activeCount ?? 0;
  const limit = data?.concurrencyLimit ?? 2;
  const waiting = data?.waitingCount ?? 0;
  const completed = data?.completed24hCount ?? 0;
  const avgDuration = formatDuration(data?.avgDurationMs24h ?? 0);
  const stuck = data?.stuckCount ?? 0;
  const failed = data?.failed24hCount ?? 0;

  const cards = [
    {
      title: "Đang thực thi",
      value: `${active} / ${limit}`,
      unit: "slots",
      detail: active > 0 ? "Tiến trình AI đang phân tích" : "Hệ thống đang sẵn sàng",
      badge: { label: `${active} Active`, color: "blue" },
      icon: Activity,
      isAlert: false,
    },
    {
      title: "Hàng đợi chờ",
      value: waiting.toString(),
      unit: "hồ sơ",
      detail: waiting > 0 ? "Đang xếp hàng chờ slot trống" : "Không có hồ sơ chờ",
      badge: { label: `${waiting} Queued`, color: "yellow" },
      icon: Clock,
      isAlert: false,
    },
    {
      title: "Thành công 24h",
      value: completed.toString(),
      unit: "hồ sơ",
      detail: `Thời lượng trung bình: ${avgDuration}`,
      badge: { label: "24 giờ qua", color: "green" },
      icon: CheckCircle2,
      isAlert: false,
    },
    {
      title: "Cần xử lý / Kẹt",
      value: (stuck + failed).toString(),
      unit: "sự cố",
      detail: `${stuck} nghi kẹt (>10p) · ${failed} thất bại`,
      badge: { label: stuck > 0 ? "Cần can thiệp" : "Bình thường", color: stuck > 0 ? "orange" : "gray" },
      icon: AlertTriangle,
      isAlert: stuck > 0,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Paper
            key={card.title}
            p="md"
            radius="md"
            withBorder
            className={`border-border-app bg-surface-app ${
              card.isAlert ? "border-amber-500/80 bg-amber-500/5" : ""
            }`}
          >
            <Group justify="space-between" align="flex-start" mb="xs">
              <Text size="xs" c="dimmed" fw={500} className="font-body">
                {card.title}
              </Text>
              <div
                className={`p-1.5 rounded-lg ${
                  card.isAlert ? "text-amber-500 bg-amber-500/10" : "text-brand bg-brand-soft/30"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </Group>

            <Group align="baseline" gap="xs" mb={4}>
              <Text
                size="xl"
                fw={700}
                className={`font-heading ${card.isAlert ? "text-amber-600 dark:text-amber-400" : "text-text-app"}`}
              >
                {isLoading ? "..." : card.value}
              </Text>
              <Text size="xs" c="dimmed" className="font-body">
                {card.unit}
              </Text>
              <Badge size="xs" variant="light" color={card.badge.color} className="ml-auto">
                {card.badge.label}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed" className="font-body line-clamp-1">
              {card.detail}
            </Text>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}
