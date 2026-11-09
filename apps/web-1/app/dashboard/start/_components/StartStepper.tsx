"use client";

import { Text } from "@mantine/core";
import { PROGRESS_STEPS, type StepId } from "../_hooks/usePreCp1Form";
import { STEP_MINUTES, STEP_NAMES } from "../_data/copy";

/** Seven segments, one per question; the filled ones are behind you. */
export function StartStepper({ step }: { step: StepId }) {
  const index = PROGRESS_STEPS.indexOf(step);
  if (index === -1) return null;
  const left = STEP_MINUTES.slice(index).reduce((sum, m) => sum + m, 0);

  return (
    <div className="sticky top-16 z-20 -mx-4 border-b border-border-app bg-surface-app px-4 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <Text size="sm" fw={600} lh={1.4}>
          {STEP_NAMES[index]}
        </Text>
        <Text size="xs" c="dimmed" className="tabular-nums">
          {index + 1}/{PROGRESS_STEPS.length} · còn khoảng {left} phút
        </Text>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {PROGRESS_STEPS.map((id, i) => (
          <span
            key={id}
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= index ? "var(--color-brand)" : "var(--color-border)" }}
          />
        ))}
      </div>
    </div>
  );
}
