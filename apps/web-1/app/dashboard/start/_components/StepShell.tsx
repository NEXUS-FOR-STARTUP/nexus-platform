"use client";

import type { ReactNode } from "react";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
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

/**
 * One question per screen. The action bar sticks to the viewport bottom, so a long
 * step (the team one runs past 2,000px) never hides the only way forward.
 */
export function StepShell({ title, why, children, error, onBack, onNext, nextLabel = "Tiếp", busy }: StepShellProps) {
  return (
    <div className="space-y-4">
      <Paper withBorder p={{ base: "lg", sm: "xl" }} style={{ borderRadius: "var(--ui-radius)" }}>
        <Stack gap="lg">
          <Stack gap={4}>
            <Title order={2} fz={{ base: 22, sm: 26 }} lh={1.25} style={{ letterSpacing: "-0.02em", textWrap: "balance" }}>
              {title}
            </Title>
            <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
              {why}
            </Text>
          </Stack>

          <div>{children}</div>
        </Stack>
      </Paper>

      <div
        className="sticky bottom-0 z-30 -mx-4 border-t border-border-app bg-surface-app px-4 py-3 shadow-[0_-1px_0_0_var(--color-border)] sm:mx-0 sm:rounded-[var(--ui-radius)] sm:border"
        aria-live="polite"
      >
        <Stack gap="xs">
          {error ? (
            <Group gap={6} wrap="nowrap" align="flex-start">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
              <Text size="sm" lh={1.5} c="var(--color-danger)">
                {error}
              </Text>
            </Group>
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
      </div>
    </div>
  );
}
