"use client";

import { useState, type ReactNode } from "react";
import { Collapse, Text } from "@mantine/core";
import { CaretDownIcon } from "@phosphor-icons/react/ssr";

interface DisclosureProps {
  label: string;
  /** One line kept visible; the rest hides until the row is opened. */
  note?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** A row that hides its detail: the list stays scannable, the text is one tap away. */
export function Disclosure({ label, note, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 rounded-[var(--ui-radius)] py-2 text-left cursor-pointer transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="min-w-0">
          <Text component="span" fz="var(--ui-text-body)" fw={600} lh={1.4} className="block">
            {label}
          </Text>
          {note ? (
            <Text component="span" fz="var(--ui-text-note)" c="dimmed" lh={1.5} className="mt-0.5 block">
              {note}
            </Text>
          ) : null}
        </span>
        <CaretDownIcon
          className={`mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          weight="bold"
        />
      </button>
      <Collapse expanded={open}>
        <div className="pt-3">{children}</div>
      </Collapse>
    </div>
  );
}
