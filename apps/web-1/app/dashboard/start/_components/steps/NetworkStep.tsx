"use client";

import { Badge, Group, Stack, Text, Textarea } from "@mantine/core";
import { NET_OPTIONS } from "@repo/validation";
import { StepShell } from "../StepShell";
import { NETWORK_LEAD, WHY } from "../../_data/copy";
import type { StartForm } from "../../_hooks/usePreCp1Form";

interface NetworkStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}

export function NetworkStep({ form, patch, error, onBack, onNext, busy }: NetworkStepProps) {
  const toggle = (id: (typeof NET_OPTIONS)[number]["id"], label: string) => {
    const on = form.network.includes(id);
    const line = `Mình quen: ${label.toLowerCase()}`;
    patch({
      network: on ? form.network.filter((n) => n !== id) : [...form.network, id],
      networkOther: on
        ? form.networkOther.replace(new RegExp(`^${line}\\n?`, "m"), "")
        : `${line}\n${form.networkOther}`.trim(),
    });
  };

  return (
    <StepShell title="Bạn dễ nhắn tin, gặp gỡ những ai?" why={WHY.network} error={error} onBack={onBack} onNext={onNext} busy={busy}>
      <Stack gap="md">
        <Text size="sm" c="dimmed" lh={1.6}>
          {NETWORK_LEAD}
        </Text>
        <Group gap="xs">
          {NET_OPTIONS.map((option) => {
            const on = form.network.includes(option.id);
            return (
              <Badge
                key={option.id}
                size="lg"
                radius="sm"
                variant={on ? "filled" : "light"}
                color={on ? "brand" : "gray"}
                className="cursor-pointer select-none"
                onClick={() => toggle(option.id, option.label)}
              >
                {option.label}
              </Badge>
            );
          })}
        </Group>
        <Textarea
          autosize
          minRows={3}
          label="Viết tự do"
          placeholder="Ví dụ: Mình quen chủ quán ăn gần trường. Bạn cùng phòng có mẹ mở tiệm may."
          value={form.networkOther}
          onChange={(e) => patch({ networkOther: e.currentTarget.value })}
        />
      </Stack>
    </StepShell>
  );
}
