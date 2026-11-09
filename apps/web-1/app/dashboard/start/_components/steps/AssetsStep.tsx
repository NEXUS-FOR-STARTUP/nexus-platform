"use client";

import { Checkbox, Stack, Textarea } from "@mantine/core";
import { ASSET_PROMPTS, TEXT_LIMITS } from "@repo/validation";
import { StepShell } from "../StepShell";
import { InfoTip } from "../InfoTip";
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

/** Five plain questions. The "why" lives in a tooltip; "không có" is a tick under the box. */
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
      lead={ASSETS_LEAD}
      error={error}
      onBack={onBack}
      onNext={onNext}
      busy={busy}
      nextLabel={busy ? "Đang đọc câu trả lời…" : "Tiếp"}
    >
      <Stack gap="lg">
        {ASSET_PROMPTS.map((prompt) => {
          const off = none(prompt.id);
          return (
            <div key={prompt.id} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="font-heading text-sm font-semibold text-text-app leading-snug">{prompt.title}</p>
                <InfoTip title={prompt.title} label={prompt.why} />
              </div>

              <Textarea
                autosize
                minRows={2}
                maxRows={6}
                maxLength={TEXT_LIMITS.assetAnswer}
                placeholder={prompt.ph}
                value={form.assets[prompt.id] ?? ""}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  patch({
                    assets: { ...form.assets, [prompt.id]: value },
                    ...(value.trim() && off ? { assetsNone: form.assetsNone.filter((x) => x !== prompt.id) } : {}),
                  });
                }}
              />

              <Checkbox
                label="Mình không có / không nhớ"
                checked={off}
                onChange={(e) => setNone(prompt.id, e.currentTarget.checked)}
              />
            </div>
          );
        })}

        <Textarea
          autosize
          minRows={2}
          maxLength={TEXT_LIMITS.assetsOther}
          label="Còn gì nữa không? (không bắt buộc)"
          placeholder="Một thứ nhỏ cũng được, ví dụ: nhà mình có sân để xe."
          value={form.assetsOther}
          onChange={(e) => patch({ assetsOther: e.currentTarget.value })}
        />
      </Stack>
    </StepShell>
  );
}
