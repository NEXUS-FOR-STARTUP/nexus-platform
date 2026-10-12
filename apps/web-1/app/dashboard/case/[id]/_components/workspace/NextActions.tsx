"use client";

import { Paper, Stack, Group, Text, Button, Badge } from "@mantine/core";
import { ArrowRight, Sparkles } from "lucide-react";
import type { NextAction } from "../../hooks/useNextActions";

interface NextActionsProps {
  actions: NextAction[];
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

export default function NextActions({ actions, onOpenStage }: NextActionsProps) {
  if (actions.length === 0) return null;

  return (
    <Stack gap="sm">
      <Group gap="xs">
        <Sparkles size={18} className="text-blue-600" />
        <Text fw={600} size="sm">Việc tiếp theo</Text>
      </Group>

      <Stack gap="xs">
        {actions.map((act) => (
          <Paper key={act.id} p="md" withBorder radius="md" bg="var(--mantine-color-blue-0)">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Stack gap={2} style={{ flex: 1, minWidth: 200 }}>
                <Group gap="xs">
                  <Text fw={600} size="sm">{act.title}</Text>
                  <Badge size="xs" variant="light" color="blue">{act.stageCode}</Badge>
                </Group>
                <Text size="xs" c="dimmed">{act.description}</Text>
              </Stack>
              <Button
                size="sm"
                rightSection={<ArrowRight size={14} />}
                onClick={() => onOpenStage(act.stageSlug, act.view)}
              >
                {act.cta}
              </Button>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
