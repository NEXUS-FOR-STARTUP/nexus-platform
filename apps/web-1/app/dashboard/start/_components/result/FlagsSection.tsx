"use client";

import { Alert, Text } from "@mantine/core";
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

/** The verdict first, then one line per axis: what is wrong is visible before why. */
export function FlagsSection({ flags, verdict, ideaMode, structureIncomplete }: FlagsSectionProps) {
  return (
    <section id="idea" className="scroll-mt-32 space-y-4">
      <Text fw={700} fz={20}>
        <Text span c="dimmed" fw={500} mr={8}>
          3
        </Text>
        {ideaMode === "none" ? "Có gì cần lưu ý" : "Ý tưởng của bạn có ổn không"}
      </Text>

      {ideaMode === "none" ? (
        <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
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

      <div className="space-y-1">
        <Text size="xs" c="dimmed">
          Kết luận
        </Text>
        <Text
          fz={{ base: 20, sm: 24 }}
          fw={600}
          lh={1.3}
          style={{ letterSpacing: "-0.01em", textWrap: "balance" }}
          c={verdict.level === "ok" ? "green" : verdict.level === "warn" ? "orange" : "red"}
        >
          {verdict.title}
        </Text>
        <Text size="sm" c="dimmed" lh={1.6} style={{ maxWidth: "62ch" }}>
          {verdict.detail}
        </Text>
      </div>

      <div className="divide-y divide-border-app border-t border-border-app">
        {flags.map((flag) => (
          <div key={flag.axis} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Text size="sm" fw={600} lh={1.4}>
                  {flag.title}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {flag.axis}
                </Text>
              </div>
              <span
                className="shrink-0 rounded-[var(--ui-radius-pill)] px-2 py-0.5 text-xs"
                style={{
                  background: `var(--color-${COLORS[flag.status] === "green" ? "success" : COLORS[flag.status] === "orange" ? "warning" : "danger"}-soft)`,
                  color: `var(--color-${COLORS[flag.status] === "green" ? "success" : COLORS[flag.status] === "orange" ? "warning" : "danger"}-ink)`,
                }}
              >
                {STATUS[flag.status].label}
              </span>
            </div>
            <Text size="sm" mt={6} lh={1.6}>
              {flag.reason}
            </Text>
            <Text size="sm" mt={2} lh={1.6} c="dimmed">
              {flag.fix}
            </Text>
          </div>
        ))}
      </div>
    </section>
  );
}
