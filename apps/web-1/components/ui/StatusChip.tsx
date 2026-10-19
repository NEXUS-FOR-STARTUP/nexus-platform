import type { ReactNode } from "react";
import { Badge } from "@mantine/core";
import s from "./status-chip.module.css";

export type ChipTone = "draft" | "ok" | "warn" | "error" | "neutral";

const TONE_COLOR: Record<ChipTone, string> = {
  draft: "blue",
  ok: "green",
  warn: "orange",
  error: "red",
  neutral: "gray",
};

interface StatusChipProps {
  tone: ChipTone;
  children: ReactNode;
  leftSection?: ReactNode;
}

export function StatusChip({ tone, children, leftSection }: StatusChipProps) {
  return (
    <Badge
      variant="light"
      size="md"
      radius="sm"
      color={TONE_COLOR[tone]}
      leftSection={leftSection}
      classNames={{ label: s.label }}
    >
      {children}
    </Badge>
  );
}
