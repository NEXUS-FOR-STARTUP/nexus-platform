"use client";

import { Alert, Badge, Text } from "@mantine/core";
import { Info } from "@phosphor-icons/react/ssr";
import type { PreCp1Flag, PreCp1Verdict } from "@repo/validation";
import { RESULT, STATUS } from "../../_data/copy";
import { SectionHead } from "./SectionHead";

const TONE = { ok: "success", warn: "warning", hard: "danger", blocked: "danger" } as const;
const BADGE = { success: "green", warning: "orange", danger: "red" } as const;

interface FlagsSectionProps {
  flags: PreCp1Flag[];
  verdict: PreCp1Verdict;
  ideaMode: "none" | "draft" | "structured";
  structureIncomplete: boolean;
}

/** The verdict first, then one block per axis: what is wrong is visible before why. */
export function FlagsSection({ flags, verdict, ideaMode, structureIncomplete }: FlagsSectionProps) {
  const tone = TONE[verdict.level];
  return (
    <section id="idea" className="scroll-mt-24 space-y-5">
      <SectionHead
        title={ideaMode === "none" ? "Có gì cần lưu ý" : "Ý tưởng của bạn có ổn không"}
        note={ideaMode === "none" ? RESULT.ideaSectionNote : undefined}
      />

      {structureIncomplete ? (
        <Alert color="orange" variant="light" icon={<Info className="h-4 w-4" />}>
          <Text fz="var(--ui-text-note)" lh={1.6}>
            {RESULT.structuredIncomplete}
          </Text>
        </Alert>
      ) : null}

      <div className="rounded-[var(--ui-radius)] p-4 sm:p-5" style={{ background: `var(--color-${tone}-soft)` }}>
        <Text
          fz={{ base: 22, sm: 26 }}
          fw={700}
          lh={1.2}
          style={{ letterSpacing: "-0.02em", textWrap: "balance", color: `var(--color-${tone}-ink)` }}
        >
          {verdict.title}
        </Text>
        <Text fz={{ base: 16, sm: 18 }} mt={8} lh={1.6} style={{ maxWidth: "62ch", color: `var(--color-${tone}-ink)` }}>
          {verdict.detail}
        </Text>
      </div>

      <ul className="space-y-3">
        {flags.map((flag) => {
          const flagTone = TONE[flag.status];
          return (
            <li key={flag.axis} className="rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-app px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Text fz="var(--ui-text-note)" c="dimmed" lh={1.4} style={{ letterSpacing: "0.01em" }}>
                    {flag.axis}
                  </Text>
                  <Text fz="var(--ui-text-section)" fw={600} lh={1.35} mt={2} style={{ letterSpacing: "-0.01em" }}>
                    {flag.title}
                  </Text>
                </div>
                <Badge variant="light" color={BADGE[flagTone]} radius="var(--ui-radius-sm)" className="shrink-0">
                  {STATUS[flag.status].label}
                </Badge>
              </div>
              <Text fz="var(--ui-text-body)" mt={10} lh={1.6} style={{ maxWidth: "62ch" }}>
                {flag.reason}
              </Text>
              <Text fz="var(--ui-text-note)" mt={4} lh={1.55} c="dimmed" style={{ maxWidth: "62ch" }}>
                {flag.fix}
              </Text>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
