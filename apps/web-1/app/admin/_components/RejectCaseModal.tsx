"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import { XCircle, Loader2 } from "lucide-react";

interface RejectCaseModalProps {
  caseId: string | null;
  onClose: () => void;
  onReject: (caseId: string, reason: string) => Promise<void>;
}

export default function RejectCaseModal({
  caseId,
  onClose,
  onReject,
}: RejectCaseModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setRejectReason("");
      setError(null);
    }
  }, [caseId]);

  const handleSubmit = async () => {
    if (!caseId || rejectReason.trim().length < 10) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onReject(caseId, rejectReason.trim());
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Đã xảy ra lỗi khi từ chối hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={caseId !== null}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-danger font-heading font-bold text-h3">
          <XCircle className="w-6 h-6" />
          <span>Từ chối hồ sơ phản biện</span>
        </div>
      }
      centered
    >
      <div className="space-y-4 font-body text-xs">
        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
            {error}
          </div>
        )}

        <Textarea
          label="Lý do từ chối (Bắt buộc, tối thiểu 10 ký tự)"
          placeholder="Nhập lý do chi tiết từ chối hồ sơ..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          minRows={3}
          autosize
          variant="default"
          radius="md"
          disabled={isSubmitting}
        />
        
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
            disabled={rejectReason.trim().length < 10 || isSubmitting}
            color="red"
            className="flex-1"
            leftSection={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          >
            Xác nhận Từ chối
          </Button>
        </div>
      </div>
    </Modal>
  );
}
