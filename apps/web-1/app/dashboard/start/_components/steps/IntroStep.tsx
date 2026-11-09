"use client";

import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Check } from "@phosphor-icons/react/ssr";
import { INTRO_BULLETS, INTRO_LEAD } from "../../_data/copy";

interface IntroStepProps {
  hasSaved: boolean;
  onStart: () => void;
  onResume: () => void;
}

export function IntroStep({ hasSaved, onStart, onResume }: IntroStepProps) {
  return (
    <Paper withBorder p={{ base: "lg", sm: "xl" }} style={{ borderRadius: "var(--ui-radius)" }}>
      <Stack gap="lg">
        <Stack gap={6}>
          <Title order={1} fz={{ base: 26, sm: 34 }} lh={1.15} style={{ letterSpacing: "-0.025em", textWrap: "balance" }}>
            Trước khi bắt đầu dự án
          </Title>
          <Text size="md" lh={1.7} style={{ maxWidth: "60ch" }}>
            {INTRO_LEAD}
          </Text>
        </Stack>

        <div>
          <Text size="sm" fw={600} mb="xs">
            Kết quả nhận được
          </Text>
          <ul className="space-y-2">
            {INTRO_BULLETS.map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" weight="bold" />
                <span className="text-sm leading-relaxed" style={{ maxWidth: "62ch" }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Group gap="sm">
          <Button color="brand" size="md" onClick={onStart}>
            Bắt đầu
          </Button>
          {hasSaved ? (
            <Button variant="subtle" color="gray" size="md" onClick={onResume}>
              Xem lại kết quả đã lưu
            </Button>
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );
}
