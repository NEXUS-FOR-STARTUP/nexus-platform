"use client";

import { Stack, Text, Textarea } from "@mantine/core";
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
        <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
          {NETWORK_LEAD}
        </Text>
        <div className="flex flex-wrap gap-2">
          {NET_OPTIONS.map((option) => {
            const on = form.network.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(option.id, option.label)}
                className={[
                  "rounded-[var(--ui-radius-pill)] border px-3 py-1.5 text-sm transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
                  "active:scale-[0.98] motion-reduce:active:scale-100",
                  on
                    ? "border-brand bg-brand text-white"
                    : "border-border-app bg-surface-app hover:border-brand-mid hover:bg-surface-soft",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <Textarea
          autosize
          minRows={3}
          label="Viết tự do"
          description="Chip ở trên điền sẵn câu vào ô này. Bạn sửa lại cho đúng ý mình."
          placeholder="Ví dụ: Mình quen chủ quán ăn gần trường. Bạn cùng phòng có mẹ mở tiệm may."
          value={form.networkOther}
          onChange={(e) => patch({ networkOther: e.currentTarget.value })}
        />
      </Stack>
    </StepShell>
  );
}
