"use client";

import { Checkbox, Stack, Text, Textarea } from "@mantine/core";
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

export function AssetsStep({ form, patch, error, onBack, onNext, busy }: AssetsStepProps) {
  const none = (id: string) => form.assetsNone.includes(id);
  return (
    <StepShell title="Nhóm bạn đang có gì sẵn?" why={WHY.assets} error={error} onBack={onBack} onNext={onNext} busy={busy} nextLabel={busy ? "AI đang đọc câu trả lời…" : "Tiếp"}>
      <Stack gap="xl">
        <Text size="sm" c="dimmed" lh={1.6}>
          {ASSETS_LEAD}
        </Text>
        {ASSET_PROMPTS.map((prompt) => (
          <Stack key={prompt.id} gap="xs">
            <Text size="sm" fw={600} lh={1.5}>
              {prompt.title}
            </Text>
            <Text size="xs" c="dimmed" lh={1.5}>
              {prompt.why}
            </Text>
            <Textarea
              autosize
              minRows={2}
              placeholder={prompt.ph}
              value={form.assets[prompt.id] ?? ""}
              disabled={none(prompt.id)}
              onChange={(e) => patch({ assets: { ...form.assets, [prompt.id]: e.currentTarget.value } })}
            />
            <Checkbox
              size="sm"
              label="Mình không có / không nhớ"
              checked={none(prompt.id)}
              onChange={(e) =>
                patch({
                  assetsNone: e.currentTarget.checked ? [...form.assetsNone, prompt.id] : form.assetsNone.filter((id) => id !== prompt.id),
                  assets: e.currentTarget.checked ? { ...form.assets, [prompt.id]: "" } : form.assets,
                })
              }
            />
          </Stack>
        ))}
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
