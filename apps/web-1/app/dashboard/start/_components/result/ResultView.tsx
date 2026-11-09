"use client";

import { useEffect, useState } from "react";
import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Warning as AlertTriangle } from "@phosphor-icons/react/ssr";
import type { PreCp1Input, PreCp1Report, TeamFitSavedResult } from "@repo/validation";
import { TeamSection } from "./TeamSection";
import { RecruitSection } from "./RecruitSection";
import { FlagsSection } from "./FlagsSection";
import { ZonesSection } from "./ZonesSection";
import { AiResultCard } from "./AiResultCard";
import { RESULT } from "../../_data/copy";

export interface ResultViewProps {
  report: PreCp1Report;
  input: PreCp1Input;
  ideaMode: "none" | "draft" | "structured";
  structureIncomplete: boolean;
  aiResult: TeamFitSavedResult | null;
  aiFailed: boolean;
  aiLoading: boolean;
  saving: boolean;
  saveFailed: boolean;
  savedCaseId: string | null;
  onCreateProject: () => void;
  onOpenCase: (caseId: string) => void;
  onEdit: () => void;
  onRestart: () => void;
}

const TOC = [
  { href: "#team", label: "Nhóm hiện tại" },
  { href: "#recruit", label: "Nên tìm thêm ai" },
  { href: "#idea", label: "Ý tưởng có ổn không" },
  { href: "#zones", label: "Hướng để hỏi thử" },
] as const;

const RESTART_WINDOW_MS = 5000;

/** One column: reading order is the page order, the section links stay in reach. */
export function ResultView(props: ResultViewProps) {
  const { report, input, ideaMode, structureIncomplete, aiResult, aiFailed, aiLoading } = props;
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    if (!confirmRestart) return;
    const timer = setTimeout(() => setConfirmRestart(false), RESTART_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [confirmRestart]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Title order={1} fz={{ base: 24, sm: 30 }} lh={1.2} style={{ letterSpacing: "-0.02em", textWrap: "balance" }}>
          {RESULT.title}
        </Title>
        <Text size="sm" lh={1.7} style={{ maxWidth: "62ch" }}>
          {RESULT.beforeReading}
        </Text>
      </header>

      <nav className="sticky top-16 z-20 -mx-4 border-y border-border-app bg-surface-app px-4 py-1.5" aria-label={RESULT.toc}>
        <div className="flex gap-1 overflow-x-auto">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-[var(--ui-radius-pill)] px-3 py-1 text-xs text-text-muted transition-colors hover:bg-surface-muted hover:text-text-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-8 divide-y divide-border-app [&>section]:pt-6 [&>section:first-child]:pt-0">
        <TeamSection report={report} input={input} />
        <RecruitSection recruit={report.recruit} input={input} />
        <FlagsSection flags={report.flags} verdict={report.verdict} ideaMode={ideaMode} structureIncomplete={structureIncomplete} />
        <ZonesSection zones={report.zones} />
        {ideaMode === "structured" ? <AiResultCard result={aiResult} failed={aiFailed} loading={aiLoading} /> : null}
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border-app bg-surface-app px-4 py-3 shadow-[0_-1px_0_0_var(--color-border)]">
        <Stack gap="xs">
          {props.saveFailed ? (
            <Group gap={6} wrap="nowrap" align="flex-start">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
              <Text size="sm" lh={1.5} c="var(--color-warning-ink)">
                {RESULT.saveFailed}
              </Text>
            </Group>
          ) : null}
          <Group gap="sm" wrap="wrap">
            {props.savedCaseId ? (
              <>
                <Button color="brand" onClick={() => props.onOpenCase(props.savedCaseId!)}>
                  {RESULT.openCase}
                </Button>
                <Text size="sm" c="green">
                  {RESULT.saved}
                </Text>
              </>
            ) : (
              <Button color="brand" onClick={props.onCreateProject} loading={props.saving} disabled={props.saving}>
                {RESULT.createdAt}
              </Button>
            )}
            <Button variant="default" onClick={props.onEdit}>
              {RESULT.edit}
            </Button>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => {
                if (confirmRestart) {
                  setConfirmRestart(false);
                  props.onRestart();
                } else {
                  setConfirmRestart(true);
                }
              }}
            >
              {confirmRestart ? RESULT.restartConfirm : RESULT.restart}
            </Button>
          </Group>
        </Stack>
      </div>
    </div>
  );
}
