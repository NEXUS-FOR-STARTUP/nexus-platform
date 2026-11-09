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

/** One answer option. Whole card is the target, so a mis-tap never lands between rows. */
export function OptionCard({ selected, onSelect, title, description, children, disabled }: OptionCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        "h-full w-full rounded-xl border p-4 text-left transition-colors",
        selected ? "border-brand bg-brand/5" : "border-gray-200 hover:border-gray-300",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
            selected ? "border-brand bg-brand text-white" : "border-gray-300",
          ].join(" ")}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-snug">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span> : null}
          {children}
        </span>
      </div>
    </button>
  );
}
