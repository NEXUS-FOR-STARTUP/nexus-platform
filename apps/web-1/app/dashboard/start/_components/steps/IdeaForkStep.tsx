"use client";

import { SimpleGrid, Stack } from "@mantine/core";
import { StepShell } from "../StepShell";
import { OptionCard } from "../OptionCard";
import { WHY } from "../../_data/copy";
import type { StartForm } from "../../_hooks/usePreCp1Form";

const CHOICES = [
  { id: "structured", title: "Đã có, mô tả được cụ thể", sub: "Biết làm cho ai, họ gặp chuyện gì, bạn định làm gì." },
  { id: "draft", title: "Có, nhưng mới vài dòng", sub: "Mới là cảm giác hoặc một câu mơ hồ. Không sao." },
  { id: "none", title: "Chưa có", sub: "Chỉ muốn biết nhóm mạnh gì và nên tìm ai." },
] as const;

interface IdeaForkStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
}

export function IdeaForkStep({ form, patch, error, onBack, onNext }: IdeaForkStepProps) {
  return (
    <StepShell title="Bạn đã có ý tưởng chưa?" why={WHY.idea} error={error} onBack={onBack} onNext={onNext}>
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          {CHOICES.map((choice) => (
            <OptionCard
              key={choice.id}
              title={choice.title}
              description={choice.sub}
              selected={form.ideaMode === choice.id}
              onSelect={() => patch({ ideaMode: choice.id })}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </StepShell>
  );
}
