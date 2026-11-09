"use client";

import type { ReactNode } from "react";
import { Alert, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Warning as AlertTriangle } from "@phosphor-icons/react/ssr";

interface StepShellProps {
  title: string;
  why: string;
  children: ReactNode;
  error?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  busy?: boolean;
}

/** One question per screen, with the "why we ask" line above it and one way out. */
export function StepShell({ title, why, children, error, onBack, onNext, nextLabel = "Tiếp", busy }: StepShellProps) {
  return (
    <Paper withBorder radius="xl" p={{ base: "lg", sm: "xl" }}>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2} fz={{ base: 22, sm: 26 }}>
            {title}
          </Title>
          <Text size="sm" c="dimmed" lh={1.6}>
            {why}
          </Text>
        </Stack>

        <div>{children}</div>

        {error ? (
          <Alert color="orange" icon={<AlertTriangle className="h-4 w-4" />} variant="light">
            <Text size="sm">{error}</Text>
          </Alert>
        ) : null}

        <Group justify="space-between" gap="sm">
          {onBack ? (
            <Button variant="subtle" color="gray" onClick={onBack} disabled={busy}>
              Quay lại
            </Button>
          ) : (
            <span />
          )}
          {onNext ? (
            <Button color="brand" onClick={onNext} loading={busy}>
              {nextLabel}
            </Button>
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );
}
