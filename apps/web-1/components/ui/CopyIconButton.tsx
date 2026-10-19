"use client";

import { ActionIcon, CopyButton, Tooltip } from "@mantine/core";
import { Check, Copy } from "lucide-react";

const COPIED_RESET_MS = 1500;

interface CopyIconButtonProps {
  value: string;
  /** Accessible name, e.g. "Sao chép mã dự án". */
  label: string;
}

export function CopyIconButton({ value, label }: CopyIconButtonProps) {
  return (
    <CopyButton value={value} timeout={COPIED_RESET_MS}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? "Đã sao chép" : label} withArrow>
          <ActionIcon variant="subtle" color={copied ? "green" : "gray"} size="md" onClick={copy} aria-label={label}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}
