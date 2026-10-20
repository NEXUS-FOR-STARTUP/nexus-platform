"use client";

import { useClipboard } from "@mantine/hooks";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import s from "./credit-tx.module.css";

const COPIED_RESET_MS = 1500;
const ICON_SIZE = 14;

/** An id or bank reference in a code box, followed by a 28px copy button. */
export default function CodeCopy({ value }: { value: string }) {
  const clipboard = useClipboard({ timeout: COPIED_RESET_MS });
  return (
    <>
      <code className={s.code}>{value}</code>
      <button
        type="button"
        className={s.cp}
        aria-label={clipboard.copied ? "Đã sao chép" : `Sao chép ${value}`}
        onClick={() => clipboard.copy(value)}
      >
        {clipboard.copied ? <CheckIcon size={ICON_SIZE} aria-hidden /> : <CopyIcon size={ICON_SIZE} aria-hidden />}
      </button>
    </>
  );
}
