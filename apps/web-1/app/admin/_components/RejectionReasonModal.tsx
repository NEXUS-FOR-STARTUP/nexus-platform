import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Modal, Button, Textarea } from "@mantine/core";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

export default function RejectionReasonModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length < 10) return;
    onConfirm(reason.trim());
    setReason("");
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
        <div className="flex items-center gap-2 text-danger font-heading font-bold text-h3">
          <AlertCircle className="w-6 h-6" />
          <span>Từ chối giao dịch thanh toán</span>
        </div>
      }
      size="md"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body">
        <Textarea
          label="Lý do từ chối (Bắt buộc)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do từ chối chuyển khoản cụ thể (ví dụ: Số tiền chuyển khoản không khớp, sai nội dung chuyển khoản...)"
          maxLength={250}
          required
          minRows={3}
          autosize
          variant="default"
          radius="md"
        />
        <div className="flex justify-between items-center text-base mt-1">
          <span className={reason.length < 10 ? "text-danger" : "text-success"}>
            {reason.length < 10 
              ? `Cần nhập tối thiểu 10 ký tự (Hiện tại: ${reason.length}/10)` 
              : "Đủ điều kiện phê duyệt"}
          </span>
          <span className="text-text-subtle">{reason.length}/250</span>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            variant="default"
            className="flex-1 text-text-muted hover:text-text-app font-body font-semibold text-xs h-10 cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={reason.trim().length < 10 || isSubmitting}
            color="red"
            className="flex-1 font-body font-semibold text-xs h-10 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận Từ chối"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
