"use client";

import { useClipboard } from "@mantine/hooks";
import { Check, Copy } from "@phosphor-icons/react";
import s from "./overview.module.css";

const COPIED_RESET_MS = 1500;
const ICON_SIZE = 14;

interface CaseCodeChipProps {
  code: string;
}

export default function CaseCodeChip({ code }: CaseCodeChipProps) {
  const clipboard = useClipboard({ timeout: COPIED_RESET_MS });

  return (
    <button
      type="button"
      className={s.codeChip}
      aria-label={clipboard.copied ? "Đã sao chép mã dự án" : "Sao chép mã dự án"}
      onClick={() => clipboard.copy(code)}
    >
      {code}
      {clipboard.copied ? <Check size={ICON_SIZE} aria-hidden /> : <Copy size={ICON_SIZE} aria-hidden />}
    </button>
  );
}
