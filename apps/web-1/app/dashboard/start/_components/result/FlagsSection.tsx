"use client";

import { Alert, Badge, Stack, Text } from "@mantine/core";
import { Info } from "@phosphor-icons/react/ssr";
import type { PreCp1Flag, PreCp1Verdict } from "@repo/validation";
import { RESULT, STATUS } from "../../_data/copy";

const COLORS = { ok: "green", warn: "orange", hard: "red", blocked: "red" } as const;

interface FlagsSectionProps {
  flags: PreCp1Flag[];
  verdict: PreCp1Verdict;
  ideaMode: "none" | "draft" | "structured";
  structureIncomplete: boolean;
}

export function FlagsSection({ flags, verdict, ideaMode, structureIncomplete }: FlagsSectionProps) {
  return (
    <section id="idea" className="space-y-4">
      <Text fw={700} fz={20}>
        3. {ideaMode === "none" ? "Có gì cần lưu ý" : "Ý tưởng của bạn có ổn không"}
      </Text>
      {ideaMode === "none" ? (
        <Text size="sm" c="dimmed" lh={1.6}>
          {RESULT.ideaSectionNote}
        </Text>
      ) : null}
      {structureIncomplete ? (
        <Alert color="orange" variant="light" icon={<Info className="h-4 w-4" />}>
          <Text size="sm" lh={1.6}>
            {RESULT.structuredIncomplete}
          </Text>
        </Alert>
      ) : null}

      <div className="rounded-xl border border-gray-100 p-4">
        <Text size="xs" c="dimmed">
          Kết luận
        </Text>
        <Text fz={22} fw={700} lh={1.3} c={verdict.level === "ok" ? "green" : verdict.level === "warn" ? "orange" : "red"}>
          {verdict.title}
        </Text>
        <Text size="sm" c="dimmed" mt={4} lh={1.6}>
          {verdict.detail}
        </Text>
      </div>

      <Stack gap="sm">
        {flags.map((flag) => (
          <div key={flag.axis} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text size="sm" fw={600}>
                  {flag.title}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {flag.axis}
                </Text>
              </div>
              <Badge color={COLORS[flag.status]} variant="light" radius="sm">
                {STATUS[flag.status].icon} {STATUS[flag.status].label}
              </Badge>
            </div>
            <Text size="sm" mt={8} lh={1.6}>
              {flag.reason}
            </Text>
            <Text size="sm" mt={4} lh={1.6} c="dimmed">
              {flag.fix}
            </Text>
          </div>
        ))}
      </Stack>
    </section>
  );
}
