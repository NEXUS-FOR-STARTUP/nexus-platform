"use client";

import { Button, Group, Stack, Text } from "@mantine/core";
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
  const toggle = (id: (typeof SENSITIVE)[number]["id"]) => {
    const withoutNone = form.sensitive.filter((s) => s !== "none");
    if (id === "none") {
      patch({ sensitive: form.sensitive.includes("none") ? [] : ["none"] });
      return;
    }
    patch({ sensitive: form.sensitive.includes(id) ? form.sensitive.filter((s) => s !== id) : [...withoutNone, id] });
  };

  return (
    <StepShell title="Có điều gì dính đến ý tưởng của bạn không?" why={WHY.sensitive} error={error} onBack={onBack} onNext={onNext} busy={busy} nextLabel="Xem kết quả">
      <Group gap="xs">
        {SENSITIVE.map((item) => {
          const on = form.sensitive.includes(item.id);
          return (
            <Button
              key={item.id}
              size="compact-md"
              radius="var(--ui-radius-pill)"
              variant={on ? "filled" : "default"}
              color={on ? "brand" : "gray"}
              aria-pressed={on}
              onClick={() => toggle(item.id)}
            >
              {item.label}
            </Button>
          );
        })}
      </Group>
      <Stack gap={0}>
        <Text size="xs" c="dimmed" mt="xs" lh={1.5}>
          Chọn tất cả những gì đúng. Không có thì chọn dòng “Không có gì”.
        </Text>
      </Stack>
    </StepShell>
  );
}
