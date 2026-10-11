"use client";

import { Modal, Stack, Text, Button, Radio, Group, Paper, Alert } from "@mantine/core";
import { useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";

interface AuditConfirmModalProps {
  stage: StageDefinition;
  opened: boolean;
  onClose: () => void;
  onConfirm: (scope: string) => void;
  creditsRemaining: number;
  missingMandatoryCount?: number;
  isLoading?: boolean;
}

export default function AuditConfirmModal({
  stage,
  opened,
  onClose,
  onConfirm,
  creditsRemaining,
  missingMandatoryCount = 0,
  isLoading = false,
}: AuditConfirmModalProps) {
  const isCp2 = stage.code === "CP2";
  const [scope, setScope] = useState<string>("full");

  const handleConfirm = () => {
    onConfirm(scope);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`Xác nhận chấm bài — ${stage.name}`} centered size="md">
      <Stack gap="md">
        {isCp2 && (
          <Radio.Group
            value={scope}
            onChange={setScope}
            label="Phạm vi chấm"
            description="Chọn gói đánh giá bạn muốn AI thực hiện."
          >
            <Stack gap="xs" mt="xs">
              <Radio value="full" label="Đánh giá toàn diện (Đề xuất)" description="Kiểm tra bảng hỏi, logic khảo sát và tài liệu đính kèm" />
              <Radio value="questionnaire" label="Chỉ soát bảng hỏi" description="Chỉ kiểm tra cấu trúc câu hỏi khảo sát" />
            </Stack>
          </Radio.Group>
        )}

        {missingMandatoryCount > 0 && (
          <Alert icon={<AlertCircle size={16} />} color="yellow" title="Còn câu điều kiện chưa điền">
            Bạn còn {missingMandatoryCount} câu điều kiện chưa trả lời. Bạn vẫn có thể gửi chấm, nhưng hội đồng có thể trừ điểm phần này.
          </Alert>
        )}

        <Paper p="sm" withBorder bg="var(--mantine-color-gray-0)">
          <Stack gap={4}>
            <Text size="xs" fw={600}>Hệ thống AI sẽ phân tích:</Text>
            <Text size="xs" c="dimmed">• Các câu trả lời trong mẫu {stage.name}</Text>
            <Text size="xs" c="dimmed">• Tài liệu tệp đính kèm bạn đã tải lên giai đoạn này</Text>
            {stage.code === "CP2" && <Text size="xs" c="dimmed">• Tóm tắt ý tưởng ở giai đoạn trước</Text>}
          </Stack>
        </Paper>

        <Group justify="space-between">
          <Text size="sm">Chi phí:</Text>
          <Text size="sm" fw={600} c="blue">
            Dùng 1 lượt (còn {creditsRemaining} → {Math.max(creditsRemaining - 1, 0)})
          </Text>
        </Group>

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            color="blue"
            leftSection={<Sparkles size={16} />}
            loading={isLoading}
            onClick={handleConfirm}
          >
            Bắt đầu chấm bài
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
