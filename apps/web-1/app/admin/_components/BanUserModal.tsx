"use client";

import React, { useState } from "react";
import { Ban, AlertCircle } from "lucide-react";
import { Modal, Button, Textarea, Text } from "@mantine/core";

interface BanUserModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function BanUserModal({ isOpen, userName, onClose, onConfirm, isSubmitting }: BanUserModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    try {
      await onConfirm(reason.trim());
      setReason("");
    } catch {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-1.5 text-danger font-heading font-semibold text-sm">
          <Ban className="w-4 h-4" />
          <span>Khóa tài khoản</span>
        </div>
      }
      size="md"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body">
        <Text size="sm" className="text-text-muted">
          Bạn sắp khóa tài khoản của{" "}
          <span className="font-semibold text-text-app">{userName}</span>.
          Người dùng sẽ không thể đăng nhập và tất cả phiên đăng nhập sẽ bị hủy.
        </Text>

        <Textarea
          label="Lý do khóa (không bắt buộc)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do khóa tài khoản..."
          maxLength={250}
          minRows={2}
          autosize
          variant="default"
          radius="md"
        />

        <div className="flex justify-end text-xs text-text-subtle">
          {reason.length}/250
        </div>

        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            variant="default"
            className="flex-1 text-text-muted hover:text-text-app font-body font-semibold text-xs h-10 cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            color="red"
            className="flex-1 font-body font-semibold text-xs h-10 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận khóa"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
