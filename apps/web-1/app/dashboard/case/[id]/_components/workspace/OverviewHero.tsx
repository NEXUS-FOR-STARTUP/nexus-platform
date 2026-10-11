"use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import type { NextAction } from "../../hooks/useNextActions";

interface OverviewHeroProps {
  action: NextAction | null;
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

export default function OverviewHero({ action, onOpenStage }: OverviewHeroProps) {
  if (!action) return null;

  return (
    <Paper p="lg" radius="md" bg="var(--mantine-color-blue-0)" withBorder>
      <Stack gap="xs">
        <Text size="xs" fw={600} c="blue" tt="uppercase">Việc tiếp theo</Text>
        <Text fw={700} size="lg">{action.title}</Text>
        <Text size="sm" c="dimmed">{action.description}</Text>
        <Group>
          <Button
            size="sm"
            rightSection={<ArrowRight size={14} />}
            onClick={() => onOpenStage(action.stageSlug, action.view)}
          >
            {action.cta}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
