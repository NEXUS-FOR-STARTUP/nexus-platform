"use client";

import { useState } from "react";
import { Modal, Stack, Text, TextInput, Button, Group } from "@mantine/core";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteAccountModal({
  opened,
  onClose,
  onConfirm,
  loading,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  // Hỗ trợ cả gõ không dấu "XOA" lẫn gõ có dấu "XÓA" (tránh xung đột với bộ gõ tiếng Việt Unikey/EVKey)
  const isConfirmed = ["XOA", "XÓA"].includes(confirmText.trim().toUpperCase());

  const handleClose = () => {
    if (loading) return;
    setConfirmText("");
    onClose();
  };

  const handleConfirm = () => {
    if (!isConfirmed || loading) return;
    onConfirm();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <Text fw={600} c="red" className="font-heading">
            Xóa tài khoản vĩnh viễn
          </Text>
        </Group>
      }
      centered
      size="md"
      radius="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Hành động này sẽ xóa vĩnh viễn tài khoản của bạn, hủy toàn bộ phiên làm việc trên các thiết bị và{" "}
          <strong className="text-red-500">không thể hoàn tác</strong>. Dữ liệu tài khoản của bạn sẽ bị ẩn danh hóa.
        </Text>

        <TextInput
          label="Xác nhận thao tác"
          description={
            <Text size="xs" c="dimmed">
              Vui lòng nhập <strong className="text-red-500">XOA</strong> để xác nhận.
            </Text>
          }
          placeholder="XOA"
          value={confirmText}
          onChange={(e) => setConfirmText(e.currentTarget.value)}
          disabled={loading}
          size="sm"
          autoFocus
        />

        <Group justify="flex-end" gap="sm" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            color="red"
            leftSection={<Trash2 className="w-4 h-4" />}
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            loading={loading}
          >
            Xác nhận xóa tài khoản
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
