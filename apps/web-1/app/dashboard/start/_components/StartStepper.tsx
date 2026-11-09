"use client";

import { Progress, Text } from "@mantine/core";
import { PROGRESS_STEPS, type StepId } from "../_hooks/usePreCp1Form";
import { STEP_MINUTES, STEP_NAMES } from "../_data/copy";

export function StartStepper({ step }: { step: StepId }) {
  const index = PROGRESS_STEPS.indexOf(step);
  if (index === -1) return null;
  const left = STEP_MINUTES.slice(index).reduce((sum, m) => sum + m, 0);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Text size="sm" fw={600}>
          {STEP_NAMES[index]}
        </Text>
        <Text size="xs" c="dimmed">
          Bước {index + 1} / {PROGRESS_STEPS.length} · còn khoảng {left} phút
        </Text>
      </div>
      <Progress value={((index + 1) / PROGRESS_STEPS.length) * 100} size="sm" radius="xl" />
    </div>
  );
}
