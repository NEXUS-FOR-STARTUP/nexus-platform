"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Modal, Button } from "@mantine/core";

interface ApprovePaymentModalProps {
  paymentId: string | null;
  onClose: () => void;
  onConfirm: (paymentId: string) => Promise<void>;
}

export default function ApprovePaymentModal({
  paymentId,
  onClose,
  onConfirm,
}: ApprovePaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!paymentId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(paymentId);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Đã xảy ra lỗi khi duyệt thanh toán.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={paymentId !== null}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-teal-600 font-heading font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>Xác nhận duyệt thanh toán</span>
        </div>
      }
      size="md"
      radius="md"
      centered
    >
      <div className="space-y-4 font-body">
        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-xs text-danger">
            {error}
          </div>
        )}

        <div className="bg-surface-soft border border-border-app rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-app">
              Xác nhận đã nhận đủ số tiền thanh toán cho giao dịch này?
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Sau khi xác nhận, hệ thống sẽ tự động chuyển trạng thái giao dịch sang <strong>Đã thanh toán (Paid)</strong>, kích hoạt lượt Credit tương ứng và cập nhật tiến độ hồ sơ cho sinh viên.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            variant="default"
            className="flex-1 font-body font-semibold text-xs h-9.5 cursor-pointer"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            color="teal"
            leftSection={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            className="flex-1 font-body font-semibold text-xs h-9.5 cursor-pointer"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận duyệt"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
