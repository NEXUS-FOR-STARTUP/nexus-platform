"use client";

import { Modal, Stack, Text, Button, Group } from "@mantine/core";
import { AlertTriangle, LogOut } from "lucide-react";

interface RevokeOthersModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  otherSessionsCount?: number;
}

export function RevokeOthersModal({
  opened,
  onClose,
  onConfirm,
  loading,
  otherSessionsCount,
}: RevokeOthersModalProps) {
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <Text fw={600} className="font-heading text-text-primary">
            Đăng xuất khỏi tất cả thiết bị khác
          </Text>
        </Group>
      }
      centered
      size="md"
      radius="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Hành động này sẽ hủy phiên đăng nhập trên toàn bộ các trình duyệt và thiết bị khác
          {otherSessionsCount ? ` (khoảng ${otherSessionsCount} thiết bị)` : ""}. Bạn vẫn sẽ
          duy trì phiên làm việc trên thiết bị hiện tại.
        </Text>

        <Group justify="flex-end" gap="sm" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            color="red"
            leftSection={<LogOut className="w-4 h-4" />}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            Xác nhận đăng xuất
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
