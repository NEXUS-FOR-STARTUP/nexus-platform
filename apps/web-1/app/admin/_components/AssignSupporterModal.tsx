"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Select } from "@mantine/core";
import { UserCheck, Loader2 } from "lucide-react";
import { User } from "@/types";

interface AssignSupporterModalProps {
  caseId: string | null;
  onClose: () => void;
  supporters: User[];
  onAssign: (caseId: string, supporterId: string) => Promise<void>;
}

export default function AssignSupporterModal({
  caseId,
  onClose,
  supporters,
  onAssign,
}: AssignSupporterModalProps) {
  const [selectedId, setSelectedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setSelectedId("");
      setError(null);
    }
  }, [caseId]);

  const handleSubmit = async () => {
    if (!caseId || !selectedId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAssign(caseId, selectedId);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Đã xảy ra lỗi khi phân công.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={caseId !== null}
      onClose={onClose}
      title={
        <div className="flex items-center gap-1.5 text-brand font-heading font-semibold text-sm">
          <UserCheck className="w-4 h-4" />
          <span>Phân công Supporter</span>
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

        <p className="text-base text-text-muted">Chọn Supporter chuyên môn phụ trách đánh giá và hỗ trợ hồ sơ này.</p>
        
        <Select
          label="Supporter"
          placeholder="Chọn Supporter"
          data={supporters.map(sup => ({ value: sup.id, label: `${sup.name} (${sup.email})` }))}
          value={selectedId}
          onChange={(val) => setSelectedId(val || "")}
          disabled={isSubmitting}
          radius="md"
          comboboxProps={{ withinPortal: false }}
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
            disabled={!selectedId || isSubmitting}
            color="brand"
            leftSection={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            className="flex-1"
          >
            Xác nhận Phân công
          </Button>
        </div>
      </div>
    </Modal>
  );
}
