"use client";

import { Stack, Text, Textarea, UnstyledButton } from "@mantine/core";
import { ASSET_PROMPTS } from "@repo/validation";
import { StepShell } from "../StepShell";
import { ASSETS_LEAD, WHY } from "../../_data/copy";
import type { StartForm } from "../../_hooks/usePreCp1Form";

interface AssetsStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}

/** Five plain questions. "Không có" collapses the field to one grey line instead of a dead box. */
export function AssetsStep({ form, patch, error, onBack, onNext, busy }: AssetsStepProps) {
  const none = (id: string) => form.assetsNone.includes(id);

  const setNone = (id: string, off: boolean) => {
    const rest = form.assetsNone.filter((x) => x !== id);
    patch({
      assetsNone: off ? [...rest, id] : rest,
      assets: off ? { ...form.assets, [id]: "" } : form.assets,
    });
  };

  return (
    <StepShell
      title="Nhóm bạn đang có gì sẵn?"
      why={WHY.assets}
      error={error}
      onBack={onBack}
      onNext={onNext}
      busy={busy}
      nextLabel={busy ? "Đang đọc câu trả lời…" : "Tiếp"}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
          {ASSETS_LEAD}
        </Text>

        {ASSET_PROMPTS.map((prompt) => {
          const off = none(prompt.id);
          return (
            <div key={prompt.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Text size="sm" fw={600} lh={1.45}>
                    {prompt.title}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.45}>
                    {prompt.why}
                  </Text>
                </div>
                <UnstyledButton
                  onClick={() => setNone(prompt.id, !off)}
                  aria-pressed={off}
                  className="shrink-0 rounded-[var(--ui-radius-pill)] px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-surface-muted hover:text-text-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
                >
                  {off ? "Ghi lại" : "Không có"}
                </UnstyledButton>
              </div>
              {off ? (
                <Text size="xs" c="dimmed" fs="italic">
                  Đã ghi: không có.
                </Text>
              ) : (
                <Textarea
                  autosize
                  minRows={2}
                  maxRows={6}
                  placeholder={prompt.ph}
                  value={form.assets[prompt.id] ?? ""}
                  onChange={(e) => patch({ assets: { ...form.assets, [prompt.id]: e.currentTarget.value } })}
                />
              )}
            </div>
          );
        })}

        <Textarea
          autosize
          minRows={2}
          label="Còn gì nữa không? (không bắt buộc)"
          placeholder="Một thứ nhỏ cũng được, ví dụ: nhà mình có sân để xe."
          value={form.assetsOther}
          onChange={(e) => patch({ assetsOther: e.currentTarget.value })}
        />
      </Stack>
    </StepShell>
  );
}
