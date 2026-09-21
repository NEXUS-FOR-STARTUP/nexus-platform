"use client";

import { Card, Group, Text, Button, List } from "@mantine/core";
import { AlertTriangle, Info, Check } from "lucide-react";
import type { TeamFitFreeReport } from "@repo/validation";
import { PACKAGE_KEYS, formatPrice } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";

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
  const { data: auditPkg } = usePackagePrice(PACKAGE_KEYS.AI_AUDIT);
  const auditPriceLabel = formatPrice(auditPkg?.price ?? 79000);

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
          Nhấn &quot;Kiểm tra sơ bộ&quot; để hệ thống chỉ ra các điểm còn chưa rõ hoặc năng lực nhóm có thể đang thiếu
        </Text>
      </div>
    );
  }

  // ── Result state ──
  return (
    <div className="space-y-4">
      {/* Result context banner */}
      <div className="p-3 bg-surface-soft/80 border border-border-app rounded-xl text-center">
        <Text size="xs" c="dimmed">
          Đây là kết quả kiểm tra sơ bộ dựa trên thông tin mô tả ngắn của nhóm.
        </Text>
      </div>

      {/* Card 1: team gaps */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group gap="sm" mb="sm">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <Text fw={600} size="sm">
            Nhóm có thể đang thiếu...
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
            Ý tưởng dự án cần làm rõ thêm ở...
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
        <Button variant="outline" color="red" onClick={onReset}>
          Kiểm tra lại
        </Button>

        {hasSaved ? (
          <>
            <Button
              variant="filled"
              color="green"
              disabled
              rightSection={<Check className="h-4 w-4" />}
            >
              Đã lưu vào dự án
            </Button>
            <Button
              variant="filled"
              color="brand"
              onClick={onXemCase}
            >
              Xem dự án →
            </Button>
          </>
        ) : (
          <Button
            variant="filled"
            color="brand"
            onClick={onSave}
            loading={isSaving}
          >
            Lưu kết quả & Tạo dự án
          </Button>
        )}
      </Group>

      {/* Upsell banner */}
      <div className="mt-6 p-4 bg-brand/10 border border-brand/20 rounded-lg">
        <Text size="sm" fw={600} mb="xs">
          Cần đánh giá kỹ hơn từ tài liệu của dự án?
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          Tải lên slide hoặc đề cương hoàn chỉnh để nhận báo cáo phản biện chi tiết qua 5 nhóm tiêu chí. Gói {auditPriceLabel} bao gồm 2 lượt đánh giá.
        </Text>
        <Button
          size="sm"
          color="brand"
          onClick={onUpgrade}
          loading={isUpgrading}
        >
          Đánh giá dự án
        </Button>
      </div>
    </div>
  );
}
