"use client";

import { Button, Group, List, Paper, Stack, Text, Title } from "@mantine/core";
import { INTRO_BULLETS, INTRO_LEAD } from "../../_data/copy";

interface IntroStepProps {
  hasSaved: boolean;
  onStart: () => void;
  onResume: () => void;
}

export function IntroStep({ hasSaved, onStart, onResume }: IntroStepProps) {
  return (
    <Paper withBorder radius="xl" p={{ base: "lg", sm: "xl" }}>
      <Stack gap="lg">
        <Stack gap="sm">
          <Title order={1} fz={{ base: 26, sm: 32 }}>
            Trước khi bắt đầu dự án
          </Title>
          <Text size="md" lh={1.7}>
            {INTRO_LEAD}
          </Text>
        </Stack>

        <div>
          <Text size="sm" fw={600} mb="xs">
            Kết quả nhận được
          </Text>
          <List size="sm" spacing="xs" lh={1.6}>
            {INTRO_BULLETS.map((line) => (
              <List.Item key={line}>{line}</List.Item>
            ))}
          </List>
        </div>

        <Group gap="sm">
          <Button color="brand" size="md" onClick={onStart}>
            Bắt đầu
          </Button>
          {hasSaved ? (
            <Button variant="light" size="md" onClick={onResume}>
              Xem lại kết quả đã lưu
            </Button>
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );
}
