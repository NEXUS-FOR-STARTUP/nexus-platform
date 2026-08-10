"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import { Info, Loader2 } from "lucide-react";

interface RequestMoreInfoModalProps {
  caseId: string | null;
  onClose: () => void;
  onRequestMoreInfo: (caseId: string, query: string) => Promise<void>;
}

export default function RequestMoreInfoModal({
  caseId,
  onClose,
  onRequestMoreInfo,
}: RequestMoreInfoModalProps) {
  const [infoQuery, setInfoQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setInfoQuery("");
      setError(null);
    }
  }, [caseId]);

  const handleSubmit = async () => {
    if (!caseId || infoQuery.trim().length < 5) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onRequestMoreInfo(caseId, infoQuery.trim());
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={caseId !== null}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-warning font-heading font-bold text-h3">
          <Info className="w-6 h-6" />
          <span>Yêu cầu bổ sung thông tin</span>
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
          label="Yêu cầu làm rõ (Bắt buộc, tối thiểu 5 ký tự)"
          placeholder="Ví dụ: Link Drive không chia sẻ công khai. Vui lòng cấp quyền xem cho nhóm..."
          value={infoQuery}
          onChange={(e) => setInfoQuery(e.target.value)}
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
            disabled={infoQuery.trim().length < 5 || isSubmitting}
            color="brand"
            className="flex-1"
            leftSection={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          >
            Gửi yêu cầu
          </Button>
        </div>
      </div>
    </Modal>
  );
}
