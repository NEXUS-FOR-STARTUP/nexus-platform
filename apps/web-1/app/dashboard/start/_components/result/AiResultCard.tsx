"use client";

import { Alert, Skeleton, Stack, Text } from "@mantine/core";
import { Info } from "@phosphor-icons/react/ssr";
import type { TeamFitSavedResult } from "@repo/validation";
import { TeamFitReportCard } from "../ai/TeamFitReportCard";
import { SectionHead } from "./SectionHead";
import { AI_UNAVAILABLE, BUSY_LABEL, RESULT } from "../../_data/copy";

interface AiResultCardProps {
  result: TeamFitSavedResult | null;
  failed: boolean;
  errorMessage?: string | null;
  loading: boolean;
}

/** The per-major checkup, only when there was an idea to check. */
export function AiResultCard({ result, failed, errorMessage, loading }: AiResultCardProps) {
  return (
    <section id="ai" className="scroll-mt-24 space-y-4">
      <SectionHead title="Chấm thêm theo ngành và phần việc" />

      {loading || failed ? (
        <div className="space-y-4 rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-app p-4 sm:p-5">
          {loading ? (
            <Stack gap="xs" aria-busy="true">
              <Text fz="var(--ui-text-note)" c="dimmed" lh={1.6}>
                {BUSY_LABEL}
              </Text>
              <Skeleton height={18} width="55%" radius="sm" />
              <Skeleton height={14} radius="sm" />
              <Skeleton height={14} width="85%" radius="sm" />
              <Skeleton height={14} width="70%" radius="sm" />
            </Stack>
          ) : null}

          {failed ? (
            <Alert color="orange" variant="light" icon={<Info className="h-4 w-4" />}>
              <Stack gap={2}>
                <Text fz="var(--ui-text-body)" lh={1.6}>
                  {errorMessage ?? RESULT.aiFailed}
                </Text>
                {errorMessage ? null : (
                  <Text fz="var(--ui-text-note)" c="dimmed" lh={1.6}>
                    {AI_UNAVAILABLE}
                  </Text>
                )}
              </Stack>
            </Alert>
          ) : null}
        </div>
      ) : null}

      {result ? <TeamFitReportCard report={result} /> : null}
    </section>
  );
}
