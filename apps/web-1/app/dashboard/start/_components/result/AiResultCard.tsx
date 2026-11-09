"use client";

import { Alert, Stack, Text } from "@mantine/core";
import { Info } from "@phosphor-icons/react/ssr";
import type { TeamFitSavedResult } from "@repo/validation";
import { TeamFitReportCard } from "../ai/TeamFitReportCard";
import { AI_UNAVAILABLE, BUSY_LABEL, RESULT } from "../../_data/copy";

interface AiResultCardProps {
  result: TeamFitSavedResult | null;
  failed: boolean;
  loading: boolean;
}

/** The per-major checkup, only when there was an idea to check. */
export function AiResultCard({ result, failed, loading }: AiResultCardProps) {
  return (
    <section id="ai" className="space-y-3">
      <Text fw={700} fz={20}>
        Chấm thêm theo ngành và phần việc
      </Text>
      {loading ? (
        <Text size="sm" c="dimmed" lh={1.6}>
          {BUSY_LABEL}
        </Text>
      ) : null}
      {result ? <TeamFitReportCard report={result} /> : null}
      {failed ? (
        <Alert color="orange" variant="light" icon={<Info className="h-4 w-4" />}>
          <Stack gap={2}>
            <Text size="sm" lh={1.6}>
              {RESULT.aiFailed}
            </Text>
            <Text size="xs" c="dimmed" lh={1.6}>
              {AI_UNAVAILABLE}
            </Text>
          </Stack>
        </Alert>
      ) : null}
    </section>
  );
}
