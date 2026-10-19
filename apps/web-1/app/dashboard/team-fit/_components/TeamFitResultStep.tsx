import type { TeamFitSavedResult } from "@repo/validation";
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
  isSaving?: boolean;
  hasSaved?: boolean;
}

export default function TeamFitResultStep({
  result,
  isLoading,
  error,
  onReset,
  onSave,
  onXemCase,
  isSaving = false,
  hasSaved = false,
}: TeamFitResultStepProps) {
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

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Text size="sm" c="dimmed">
          Bấm &quot;Kiểm tra sơ bộ&quot; để xem kết quả.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TeamFitReportCard report={result} />

      <Group justify="space-between" gap="sm">
        <Button variant="default" onClick={onReset}>
          Kiểm tra lại
        </Button>

        {hasSaved ? (
          <Group gap="sm">
            <Button
              variant="light"
              color="green"
              disabled
              rightSection={<Check className="h-4 w-4" />}
            >
              Đã tạo
            </Button>
            <Button color="brand" onClick={onXemCase}>
              Xem dự án
            </Button>
          </Group>
        ) : (
          <Button color="brand" onClick={onSave} loading={isSaving}>
            Tạo dự án
          </Button>
        )}
      </Group>
    </div>
  );
}
