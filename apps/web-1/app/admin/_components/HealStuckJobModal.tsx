"use client";

import { useState } from "react";
import { Modal, Button, Textarea, Group, Stack, Text, Alert } from "@mantine/core";
import { Wrench, AlertTriangle, Coins } from "lucide-react";
import type { AdminWorkerJobListItem } from "../hooks/useAdminWorkers";

interface HealStuckJobModalProps {
  job: AdminWorkerJobListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, reason?: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function HealStuckJobModal({ job, isOpen, onClose, onConfirm, isSubmitting }: HealStuckJobModalProps) {
  const [reason, setReason] = useState("");

  if (!job) return null;

  const handleSubmit = async () => {
    await onConfirm(job.id, reason.trim() || undefined);
    setReason("");
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Wrench className="w-5 h-5 text-amber-500" />
          <Text fw={600} className="font-heading text-sm">Giải phóng tiến trình kẹt: {job.caseCode}</Text>
        </Group>
      }
      size="md"
      radius="md"
      centered
    >
      <Stack gap="md" className="font-body text-xs text-text-app">
        <Alert icon={<AlertTriangle className="w-4 h-4" />} color="orange" variant="light" title="Cảnh báo ngắt tiến trình">
          Hệ thống sẽ <b>ngắt cưỡng bức (force-terminate)</b> tiến trình tính toán của OMP và giải phóng slot trong hàng đợi BullMQ.
        </Alert>

        <Alert icon={<Coins className="w-4 h-4" />} color="blue" variant="light" title="Tự động hoàn trả tín chỉ">
          Nếu sinh viên chưa nhận được báo cáo kết quả hoàn chỉnh, <b>1 credit</b> sẽ tự động được hoàn trả vào ví hồ sơ kèm thông báo giải thích.
        </Alert>

        <div>
          <Text size="xs" fw={500} mb={4}>Lý do can thiệp (Tùy chọn ghi chú nội bộ)</Text>
          <Textarea
            placeholder="Ví dụ: Tiến trình thẩm định AI bị treo quá 10 phút do sự cố máy ảo..."
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            rows={3}
            size="xs"
          />
        </div>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button variant="default" size="xs" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            color="orange"
            size="xs"
            leftSection={<Wrench className="w-3.5 h-3.5" />}
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Giải phóng & Hoàn credit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
