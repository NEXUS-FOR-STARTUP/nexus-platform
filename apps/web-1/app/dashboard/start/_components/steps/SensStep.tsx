"use client";

import { Checkbox, Stack } from "@mantine/core";
import { SENSITIVE } from "@repo/validation";
import { StepShell } from "../StepShell";
import { WHY } from "../../_data/copy";
import type { StartForm } from "../../_hooks/usePreCp1Form";

interface SensStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}

export function SensStep({ form, patch, error, onBack, onNext, busy }: SensStepProps) {
  const toggle = (id: (typeof SENSITIVE)[number]["id"], on: boolean) => {
    const withoutNone = form.sensitive.filter((s) => s !== "none");
    if (id === "none") {
      patch({ sensitive: on ? ["none"] : [] });
      return;
    }
    patch({ sensitive: on ? [...withoutNone, id] : form.sensitive.filter((s) => s !== id) });
  };

  return (
    <StepShell title="Có điều gì dính đến ý tưởng của bạn không?" why={WHY.sensitive} error={error} onBack={onBack} onNext={onNext} busy={busy} nextLabel="Xem kết quả">
      <Stack gap="xs">
        {SENSITIVE.map((item) => (
          <Checkbox
            key={item.id}
            label={item.label}
            checked={form.sensitive.includes(item.id)}
            onChange={(e) => toggle(item.id, e.currentTarget.checked)}
          />
        ))}
      </Stack>
    </StepShell>
  );
}
