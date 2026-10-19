"use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { Lock } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
import type { StageStatus } from "../../hooks/useStageSummaries";
import { STAGE_STATUS } from "./stage-status";
import s from "./overview.module.css";

interface StageRowProps {
  name: string;
  note: string;
  /** Drives chip + button label. Ignored when `locked`. */
  status?: StageStatus;
  /** Opens the stage; the button is hidden when omitted or locked. */
  onOpen?: () => void;
  /** Not available yet: lock icon, "Sắp ra mắt" chip, no button. */
  locked?: boolean;
}

export default function StageRow({ name, note, status = "not_started", onOpen, locked }: StageRowProps) {
  const meta = STAGE_STATUS[status];

  return (
    <Paper p="md" withBorder radius="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Stack gap={2} style={{ flex: 1, minWidth: 200 }}>
          <Group gap="xs" wrap="nowrap">
            {locked && <Lock size={16} aria-hidden />}
            <Text className={s.name}>{name}</Text>
          </Group>
          <Text className={s.note}>{note}</Text>
        </Stack>
        <Group gap="sm" wrap="nowrap">
          <StatusChip tone={locked ? "neutral" : meta.tone}>{locked ? "Sắp ra mắt" : meta.label}</StatusChip>
          {!locked && onOpen && (
            <Button variant="default" size="sm" onClick={onOpen}>
              {meta.cta}
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
