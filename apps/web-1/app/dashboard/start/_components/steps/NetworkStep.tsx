"use client";

import { Stack, Textarea } from "@mantine/core";
import { NET_OPTIONS, TEXT_LIMITS } from "@repo/validation";
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
    <StepShell title="Bạn dễ nhắn tin, gặp gỡ những ai?" why={WHY.network} lead={NETWORK_LEAD} error={error} onBack={onBack} onNext={onNext} busy={busy}>
      <Stack gap="md">
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
                  "min-h-11 flex items-center rounded-lg border px-3 py-2 font-body text-sm leading-snug transition-colors duration-150 cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  on
                    ? "border-brand bg-brand text-white font-semibold"
                    : "border-border-strong bg-surface-app text-text-app hover:border-brand/50",
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
          maxLength={TEXT_LIMITS.networkOther}
          label="Viết tự do"
          placeholder="Ví dụ: Mình quen chủ quán ăn gần trường. Bạn cùng phòng có mẹ mở tiệm may."
          value={form.networkOther}
          onChange={(e) => patch({ networkOther: e.currentTarget.value })}
        />
      </Stack>
    </StepShell>
  );
}
