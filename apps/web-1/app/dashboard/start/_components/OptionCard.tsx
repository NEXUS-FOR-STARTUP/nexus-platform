"use client";

import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react/ssr";

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  disabled?: boolean;
}

/**
 * One answer option. A button with aria-pressed rather than a checkbox: these
 * questions take one answer, and the whole card is the target so a mis-tap never
 * lands between rows.
 */
export function OptionCard({ selected, onSelect, title, description, children, disabled }: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        "h-full w-full rounded-[var(--ui-radius)] border p-4 text-left transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
        "active:scale-[0.995] motion-reduce:active:scale-100",
        selected
          ? "border-brand bg-brand-soft"
          : "border-border-app bg-surface-app hover:border-brand-mid hover:bg-surface-soft",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] border",
            selected ? "border-brand bg-brand text-white" : "border-border-strong",
          ].join(" ")}
        >
          {selected ? <Check className="h-3.5 w-3.5" weight="bold" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-snug">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-relaxed text-text-muted">{description}</span> : null}
          {children}
        </span>
      </div>
    </button>
  );
}
