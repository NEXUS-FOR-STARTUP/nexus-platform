"use client";

import type { ReactNode } from "react";
import { Tooltip } from "@mantine/core";
import { InfoIcon } from "@phosphor-icons/react/ssr";

interface InfoTipProps {
  /** Visible next to the icon on hover, focus or tap. */
  label: ReactNode;
  /** Read by screen readers: what this tip answers. */
  title: string;
  width?: number;
}

/** Explanations live behind this icon so the card keeps only the question. */
export function InfoTip({ label, title, width = 260 }: InfoTipProps) {
  return (
    <Tooltip multiline w={width} withArrow position="top" events={{ hover: true, focus: true, touch: true }} label={label}>
      <button
        type="button"
        aria-label={`Vì sao hỏi: ${title}`}
        className="mt-0.5 inline-flex shrink-0 rounded-full text-text-muted transition-colors hover:text-text-app cursor-help focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <InfoIcon className="w-4 h-4" />
      </button>
    </Tooltip>
  );
}
