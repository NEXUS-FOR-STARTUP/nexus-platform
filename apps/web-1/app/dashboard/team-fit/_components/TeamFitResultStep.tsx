import type { TeamFitSavedResult } from "@repo/validation";
import { PACKAGE_KEYS, formatPrice } from "@/lib/pricing";
import { usePackagePrice } from "@/lib/usePackagePrice";
import { TeamFitReportCard } from "./TeamFitReportCard";
import { AlertTriangle, Check } from "lucide-react";
import { Button, Group, Text } from "@mantine/core";

interface TeamFitResultStepProps {
  result: TeamFitSavedResult | null;
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
          Nhấn &quot;Kiểm tra sơ bộ&quot; để hệ thống đếm chỉ số nhóm, nhận định đội ngũ và nêu những câu nhóm chưa trả lời được
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TeamFitReportCard report={result} />


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
