"use client";

import React, { useState } from "react";
import { Modal, Button, Textarea } from "@mantine/core";
import { HelpCircle, Loader2 } from "lucide-react";

interface SupporterRequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestMoreInfo: (query: string) => Promise<void>;
}

export default function SupporterRequestInfoModal({
  isOpen,
  onClose,
  onRequestMoreInfo,
}: SupporterRequestInfoModalProps) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setQuery("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onRequestMoreInfo(query.trim());
      handleClose();
    } catch (e) {
      const message =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-warning font-heading font-semibold text-sm">
          <HelpCircle className="w-4 h-4" />
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
          label="Nội dung yêu cầu bổ sung"
          placeholder="Nhập nội dung yêu cầu sinh viên bổ sung thông tin..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          minRows={3}
          autosize
          variant="default"
          radius="md"
          disabled={isSubmitting}
        />

        <div className="flex gap-3 pt-4 border-t border-border-app">
          <Button onClick={onClose} variant="default" className="flex-1" disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isSubmitting}
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
