"use client";

import { useState } from "react";
import { Button, Modal, Stack, Text, Group } from "@mantine/core";
import { Clock, Copy, Check, AlertTriangle } from "lucide-react";
import { BADGE_CONFIG, formatElapsedTime } from "./radar.utils";

interface RadarHeaderProps {
  status: string;
  projectName?: string;
  elapsedSecs: number;
  jobId: string;
  isCancelling: boolean;
  isRetrying: boolean;
  onCancel: () => void;
  onRetry: () => void;
}

export default function RadarHeader({
  status,
  projectName,
  elapsedSecs,
  jobId,
  isCancelling,
  isRetrying,
  onCancel,
  onRetry,
}: RadarHeaderProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const badge = BADGE_CONFIG[status] || BADGE_CONFIG.running;

  const handleCopyJobId = () => {
    navigator.clipboard.writeText(jobId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmCancel = () => {
    onCancel();
    setConfirmModalOpen(false);
  };

  return (
    <>
      <div className="space-y-2.5 pb-3 border-b border-border-app">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Badge + Project Name */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
            >
              {badge.dot && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-brand" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                </span>
              )}
              {badge.label}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-text-app truncate">
              {projectName || "Dự án đánh giá"}
            </h3>
          </div>

          {/* Right: Distinct Timer & Action Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-app bg-surface-soft text-xs font-mono font-medium text-text-muted"
              title="Thời gian thực hiện"
            >
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span>{formatElapsedTime(elapsedSecs)}</span>
            </div>

            {(status === "running" || status === "queued") && (
              <Button
                size="xs"
                color="red"
                variant="light"
                className="border border-red-200 dark:border-red-900/60 font-semibold"
                loading={isCancelling}
                onClick={() => setConfirmModalOpen(true)}
              >
                Dừng đánh giá
              </Button>
            )}

            {status === "failed" && (
              <Button
                size="xs"
                color="brand"
                variant="filled"
                loading={isRetrying}
                onClick={onRetry}
              >
                Chạy lại đánh giá
              </Button>
            )}
          </div>
        </div>

        {/* Job ID row */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-subtle font-medium">Job ID:</span>
          <button
            type="button"
            onClick={handleCopyJobId}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded bg-surface-soft border border-border-app hover:border-brand/40 text-text-app hover:text-brand transition-colors cursor-pointer group"
            title="Nhấn để sao chép Job ID"
          >
            <span className="truncate max-w-[220px] sm:max-w-md">{jobId}</span>
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <Copy className="w-3 h-3 text-text-subtle group-hover:text-brand shrink-0" />
            )}
          </button>
          {isCopied && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Đã chép
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={
          <div className="flex items-center gap-2 font-bold text-sm text-text-app">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>Xác nhận dừng đánh giá</span>
          </div>
        }
        centered
        radius="md"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" className="text-text-muted leading-relaxed">
            Bạn có chắc chắn muốn dừng tiến trình đánh giá cho dự án{" "}
            <strong className="text-text-app">{projectName || "này"}</strong>?
            Tiến trình đang chạy sẽ bị dừng lại và bạn có thể khởi chạy lại bất cứ lúc nào.
          </Text>

          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              disabled={isCancelling}
            >
              Tiếp tục chạy
            </Button>
            <Button
              color="red"
              variant="filled"
              size="sm"
              loading={isCancelling}
              onClick={handleConfirmCancel}
            >
              Dừng tiến trình
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
