"use client";

import { ActionIcon, Button, Group, Text, Tooltip } from "@mantine/core";
import { Check, CaretDown as ChevronDown, CaretUp as ChevronUp, ChatCircle as MessageCircle, X } from "@phosphor-icons/react";
import { CopyIconButton } from "@/components/ui/CopyIconButton";
import { StatusChip } from "@/components/ui/StatusChip";
import { ZALO_GROUP_URL } from "@/lib/zalo";
import type { GradingAction, GradingState } from "./grading-state";

interface GradingPanelHeaderProps {
  state: GradingState;
  headline: string;
  elapsed: string | null;
  jobId?: string;
  opened: boolean;
  isRetrying: boolean;
  zaloCopied: boolean;
  onRetry: () => void;
  onZaloClick: () => void;
  onViewResults: () => void;
  onClose: () => void;
  onToggle: () => void;
}

export default function GradingPanelHeader({
  state,
  headline,
  elapsed,
  jobId,
  opened,
  isRetrying,
  zaloCopied,
  onRetry,
  onZaloClick,
  onViewResults,
  onClose,
  onToggle,
}: GradingPanelHeaderProps) {
  const has = (action: GradingAction) => state.actions.includes(action);
  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <StatusChip tone={state.tone}>{state.label}</StatusChip>
        <Text fw={500} truncate aria-live="polite">{headline}</Text>
        {elapsed !== null && <Text size="sm" c="dimmed" ff="monospace">{elapsed}</Text>}
        {jobId && <CopyIconButton value={jobId} label="Sao chép mã lần chấm" />}
        {jobId && <Text size="sm" c="dimmed" ff="monospace">#{jobId.slice(0, 8)}</Text>}
      </Group>
      <Group gap="xs" wrap="wrap">
        {has("retry") && <Button loading={isRetrying} onClick={onRetry}>Chạy lại</Button>}
        {has("zalo") && (
          <Tooltip label="Sao chép nội dung báo lỗi và mở nhóm Zalo hỗ trợ. Dán vào nhóm để gửi admin." multiline maw={280} withArrow>
            <Button
              variant="light"
              color={zaloCopied ? "green" : "red"}
              component="a"
              href={ZALO_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={zaloCopied ? <Check size={16} /> : <MessageCircle size={16} />}
              onClick={onZaloClick}
            >
              {zaloCopied ? "Đã sao chép, hãy dán vào Zalo" : "Báo lỗi qua Zalo"}
            </Button>
          </Tooltip>
        )}
        {has("view") && <Button color="green" onClick={onViewResults}>Xem kết quả</Button>}
        {has("close") && (
          <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Đóng" onClick={onClose}>
            <X size={16} />
          </ActionIcon>
        )}
        {has("collapse") && (
          <ActionIcon variant="subtle" color="gray" size="lg" aria-label={opened ? "Thu gọn" : "Mở rộng"} aria-expanded={opened} onClick={onToggle}>
            {opened ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}
