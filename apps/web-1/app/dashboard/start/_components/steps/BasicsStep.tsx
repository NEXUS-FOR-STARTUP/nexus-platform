"use client";

import { SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { BUDGETS, COURSE_CODES, GOALS, SCHOOL_CODES } from "@repo/validation";
import { StepShell } from "../StepShell";
import { OptionCard } from "../OptionCard";
import { WHY } from "../../_data/copy";
import { clampTeam, type StartForm } from "../../_hooks/usePreCp1Form";

const SCHOOL_LABELS: Record<(typeof SCHOOL_CODES)[number], string> = {
  fpt: "Đại học FPT",
  other: "Trường khác",
};
const COURSE_LABELS: Record<(typeof COURSE_CODES)[number], string> = {
  exe101: "EXE101 — môn khởi nghiệp",
  other: "Môn khác",
};

interface BasicsStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
}

export function BasicsStep({ form, patch, error, onBack, onNext }: BasicsStepProps) {
  return (
    <StepShell title="Bạn đang học ở đâu, mục tiêu là gì?" why={WHY.basics} error={error} onBack={onBack} onNext={onNext}>
      <Stack gap="xl">
        <Stack gap="sm">
          <Text size="sm" fw={600}>Trường</Text>
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            {SCHOOL_CODES.map((code) => (
              <OptionCard
                key={code}
                title={SCHOOL_LABELS[code]}
                selected={form.school === code}
                onSelect={() => patch(clampTeam({ ...form, school: code, schoolName: "" }))}
              />
            ))}
          </SimpleGrid>
          {form.school === "other" ? (
            <TextInput
              label="Tên trường"
              placeholder="Ví dụ: Đại học Bách khoa"
              value={form.schoolName}
              onChange={(e) => patch({ schoolName: e.currentTarget.value })}
            />
          ) : null}
        </Stack>

        {form.school === "fpt" ? (
          <Stack gap="sm">
            <Text size="sm" fw={600}>Môn</Text>
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
              {COURSE_CODES.map((code) => (
                <OptionCard
                  key={code}
                  title={COURSE_LABELS[code]}
                  selected={form.course === code}
                  onSelect={() => patch({ course: code, courseName: "" })}
                />
              ))}
            </SimpleGrid>
            {form.course === "other" ? (
              <TextInput
                label="Tên môn"
                placeholder="Ví dụ: Startup"
                value={form.courseName}
                onChange={(e) => patch({ courseName: e.currentTarget.value })}
              />
            ) : null}
          </Stack>
        ) : null}

        <Stack gap="sm">
          <Text size="sm" fw={600}>Mục tiêu của bạn cho môn này</Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            {GOALS.map((goal) => (
              <OptionCard
                key={goal.id}
                title={goal.title}
                description={goal.sub}
                selected={form.goal === goal.id}
                onSelect={() => patch({ goal: goal.id })}
              />
            ))}
          </SimpleGrid>
        </Stack>

        <Stack gap="sm">
          <Text size="sm" fw={600}>Cả nhóm có thể bỏ ra khoảng bao nhiêu?</Text>
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            {BUDGETS.map((budget) => (
              <OptionCard
                key={budget.id}
                title={budget.title}
                description={budget.sub}
                selected={form.budget === budget.id}
                onSelect={() => patch({ budget: budget.id })}
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Stack>
    </StepShell>
  );
}
