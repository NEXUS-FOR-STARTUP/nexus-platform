"use client";

import type { ReactNode } from "react";
import { Text } from "@mantine/core";

interface SectionHeadProps {
  title: string;
  /** One line saying what this block answers; the heading alone is too terse on its own. */
  note?: ReactNode;
}

/** Section heading of the result page. Order is carried by position, not by a number. */
export function SectionHead({ title, note }: SectionHeadProps) {
  return (
    <header className="space-y-1.5">
      <Text component="h2" fz={{ base: 20, sm: 24 }} fw={700} lh={1.25} style={{ letterSpacing: "-0.015em", textWrap: "balance" }}>
        {title}
      </Text>
      {note ? (
        <Text component="p" fz="var(--ui-text-note)" c="dimmed" lh={1.6}>
          {note}
        </Text>
      ) : null}
    </header>
  );
}
