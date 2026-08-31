"use client";

import { Modal, Stack, Text, Button, Group } from "@mantine/core";
import { UserPlus } from "lucide-react";

interface RegisterConfirmModalProps {
  opened: boolean;
  email: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RegisterConfirmModal({
  opened,
  email,
  loading,
  onClose,
  onConfirm,
}: RegisterConfirmModalProps) {
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <UserPlus className="w-5 h-5 text-brand" />
          <Text fw={600} className="font-heading text-text-app">
            Chưa đăng ký
          </Text>
        </Group>
      }
      centered
      size="sm"
      radius="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Email {email} của bạn chưa đăng ký thành viên Nexus. Bạn có muốn đăng
          ký ngay không?
        </Text>
        <Group justify="flex-end" gap="sm" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            color="brand"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            Xác nhận
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
