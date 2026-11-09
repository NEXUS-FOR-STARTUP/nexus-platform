"use client";

import { useEffect, useState } from "react";
import { Button, Group, Text, Title } from "@mantine/core";
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
    <div className="space-y-6 pb-28">
      <header className="space-y-2">
        <Title order={1} fz={{ base: 26, sm: 32 }} lh={1.15} style={{ letterSpacing: "-0.025em", textWrap: "balance" }}>
          {RESULT.title}
        </Title>
        <Text fz="var(--ui-text-body)" lh={1.65}>
          {RESULT.beforeReading}
        </Text>
      </header>

      <div className="space-y-16">
        <TeamSection report={report} input={input} />
        <RecruitSection recruit={report.recruit} input={input} />
        <FlagsSection flags={report.flags} verdict={report.verdict} ideaMode={ideaMode} structureIncomplete={structureIncomplete} />
        <ZonesSection zones={report.zones} />
        {ideaMode === "structured" ? <AiResultCard result={aiResult} failed={aiFailed} loading={aiLoading} /> : null}
      </div>

      <div className="sticky bottom-0 z-20 pt-3">
        <div className="flex flex-col gap-2 rounded-[var(--ui-radius)] border-[1.5px] border-border-app bg-surface-app p-2.5 sm:flex-row sm:items-center sm:justify-end">
          {props.saveFailed ? (
            <Group gap={6} wrap="nowrap" align="flex-start" className="sm:mr-auto">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
              <Text fz="var(--ui-text-note)" lh={1.5} c="var(--color-warning-ink)">
                {RESULT.saveFailed}
              </Text>
            </Group>
          ) : null}
          <Group gap="xs" wrap="wrap" justify="flex-end">
            {props.savedCaseId ? (
              <>
                <Text fz="var(--ui-text-note)" c="green" className="sm:mr-2">
                  {RESULT.saved}
                </Text>
                <Button color="brand" className="sm:order-3" onClick={() => props.onOpenCase(props.savedCaseId!)}>
                  {RESULT.openCase}
                </Button>
              </>
            ) : (
              <Button color="brand" className="sm:order-3" onClick={props.onCreateProject} loading={props.saving} disabled={props.saving}>
                {RESULT.createdAt}
              </Button>
            )}
            <Button variant="default" className="sm:order-2" onClick={props.onEdit}>
              {RESULT.edit}
            </Button>
            <Button
              variant="subtle"
              color="gray"
              className="sm:order-first sm:mr-auto"
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
        </div>
      </div>
    </div>
  );
}
