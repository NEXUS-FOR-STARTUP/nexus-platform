"use client";

import s from "./FilterTabs.module.css";

export interface FilterTabItem<T extends string> {
  value: T;
  label: string;
}

interface FilterTabsProps<T extends string> {
  items: ReadonlyArray<FilterTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Overrides the default 24px gap under the tabs (the billing bar sits them beside a select). */
  className?: string;
}

export default function FilterTabs<T extends string>({ items, value, onChange, ariaLabel, className }: FilterTabsProps<T>) {
  return (
    <div className={[s.tabs, className].filter(Boolean).join(" ")} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            className={`${s.tab} ${active ? s.on : ""}`}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
