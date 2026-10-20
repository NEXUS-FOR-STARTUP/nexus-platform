import type { ReactNode } from "react";
import s from "./status-chip.module.css";

export type ChipTone = "draft" | "ok" | "warn" | "error" | "neutral";

const TONE_CLASS: Record<ChipTone, string> = {
  draft: s.draft,
  ok: s.ok,
  warn: s.warn,
  error: s.error,
  neutral: s.neutral,
};

interface StatusChipProps {
  tone: ChipTone;
  children: ReactNode;
  leftSection?: ReactNode;
}

export function StatusChip({ tone, children, leftSection }: StatusChipProps) {
  return (
    <span className={`${s.chip} ${TONE_CLASS[tone]}`}>
      {leftSection}
      {children}
    </span>
  );
}
