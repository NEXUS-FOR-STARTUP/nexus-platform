"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button } from "@mantine/core";
import { CheckCircle, Loader2 } from "lucide-react";

interface ApproveCaseModalProps {
  caseId: string | null;
  onClose: () => void;
  onApprove: (caseId: string) => Promise<void>;
}

export default function ApproveCaseModal({
  caseId,
  onClose,
  onApprove,
}: ApproveCaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setError(null);
    }
  }, [caseId]);

  const handleSubmit = async () => {
    if (!caseId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onApprove(caseId);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Đã xảy ra lỗi khi duyệt hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={caseId !== null}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-green-600 font-heading font-bold text-h3">
          <CheckCircle className="w-6 h-6 text-success" />
          <span>Xác nhận duyệt hồ sơ</span>
        </div>
      }
      centered
    >
      <div className="space-y-4 font-body text-xs text-text-app">
        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
            {error}
          </div>
        )}

        <p className="text-sm leading-relaxed">
          Xác nhận duyệt hồ sơ này là hợp lệ để tiến hành phản biện? Hồ sơ sẽ được chuyển sang trạng thái <strong>Chờ Phân Công</strong>.
        </p>
        
        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button
            onClick={onClose}
            variant="default"
            className="flex-1"
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            color="green"
            className="flex-1"
            leftSection={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            disabled={isSubmitting}
          >
            Xác nhận duyệt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
