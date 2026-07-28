"use client";

import { Card, Group, Text, Button, List } from "@mantine/core";
import { AlertTriangle, Info, Check } from "lucide-react";
import type { TeamFitFreeReport } from "@repo/validation";

interface TeamFitResultStepProps {
  result: TeamFitFreeReport | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
  onSave?: () => void;
  onXemCase?: () => void;
  onUpgrade?: () => void;
  isSaving?: boolean;
  isUpgrading?: boolean;
  hasSaved?: boolean;
}

export default function TeamFitResultStep({
  result,
  isLoading,
  error,
  onReset,
  onSave,
  onXemCase,
  onUpgrade,
  isSaving = false,
  isUpgrading = false,
  hasSaved = false,
}: TeamFitResultStepProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <Text size="sm" c="dimmed">
          Đang phân tích...
        </Text>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <Text size="sm" c="red">
          {error}
        </Text>
        <Button onClick={onReset} variant="subtle" color="gray">
          Thử lại
        </Button>
      </div>
    );
  }

  // Ready / idle state (no result yet)
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Text size="sm" c="dimmed">
          Nhấn &quot;Đánh giá&quot; để AI phân tích đội ngũ của bạn
        </Text>
      </div>
    );
  }

  // ── Result state ──
  return (
    <div className="space-y-4">
      {/* Card 1: team gaps */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group gap="sm" mb="sm">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <Text fw={600} size="sm">
            Nhóm bạn có thể thiếu...
          </Text>
        </Group>
        <List spacing="xs" size="sm">
          {result.teamGaps.map((gap, i) => (
            <List.Item key={i}>{gap}</List.Item>
          ))}
        </List>
      </Card>

      {/* Card 2: commercial gaps */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group gap="sm" mb="sm">
          <Info className="h-5 w-5 text-blue-500" />
          <Text fw={600} size="sm">
            Dự án có thể chưa rõ ở...
          </Text>
        </Group>
        <List spacing="xs" size="sm">
          {result.commercialGaps.map((gap, i) => (
            <List.Item key={i}>{gap}</List.Item>
          ))}
        </List>
      </Card>

      {/* Buttons row */}
      <Group justify="center" gap="sm">
        <Button variant="subtle" color="gray" onClick={onReset}>
          Làm lại
        </Button>

        {hasSaved ? (
          <>
            <Button
              variant="filled"
              color="green"
              disabled
              rightSection={<Check className="h-4 w-4" />}
            >
              Đã lưu
            </Button>
            <Button
              variant="filled"
              color="brand"
              onClick={onXemCase}
            >
              Xem case →
            </Button>
          </>
        ) : (
          <Button
            variant="filled"
            color="brand"
            onClick={onSave}
            loading={isSaving}
          >
            Lưu kết quả
          </Button>
        )}
      </Group>

      {/* Upsell banner */}
      <div className="mt-6 p-4 bg-brand-soft/10 border border-brand/20 rounded-lg">
        <Text size="sm" fw={600} mb="xs">
          Muốn được Supporter kiểm tra chuyên sâu?
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          Nhận phản biện chi tiết từ Supporter giàu kinh nghiệm. Giá chỉ 39.000đ / lượt.
        </Text>
        <Button
          size="sm"
          color="brand"
          onClick={onUpgrade}
          loading={isUpgrading}
        >
          Mua kiểm tra chuyên sâu
        </Button>
      </div>
    </div>
  );
}
