"use client";

import { Alert, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
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

export function ResultView(props: ResultViewProps) {
  const { report, input, ideaMode, structureIncomplete, aiResult, aiFailed, aiLoading } = props;
  return (
    <Stack gap="lg">
      <Paper withBorder radius="xl" p={{ base: "lg", sm: "xl" }}>
        <Stack gap="md">
          <Title order={1} fz={{ base: 24, sm: 30 }}>
            {RESULT.title}
          </Title>
          <Text size="sm" lh={1.7}>
            {RESULT.beforeReading}
          </Text>
          <Group gap="sm">
            <Text size="xs" c="dimmed">
              {RESULT.toc}:
            </Text>
            {TOC.map((item) => (
              <Button key={item.href} component="a" href={item.href} variant="subtle" size="compact-sm">
                {item.label}
              </Button>
            ))}
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="xl" p={{ base: "lg", sm: "xl" }}>
        <Stack gap="xl">
          <TeamSection report={report} input={input} />
          <RecruitSection recruit={report.recruit} input={input} />
          <FlagsSection
            flags={report.flags}
            verdict={report.verdict}
            ideaMode={ideaMode}
            structureIncomplete={structureIncomplete}
          />
          <ZonesSection zones={report.zones} />
          {ideaMode === "structured" ? (
            <AiResultCard result={aiResult} failed={aiFailed} loading={aiLoading} />
          ) : null}
        </Stack>
      </Paper>

      <Paper withBorder radius="xl" p={{ base: "lg", sm: "xl" }}>
        <Stack gap="md">
          {props.saveFailed ? (
            <Alert color="orange" variant="light" icon={<AlertTriangle className="h-4 w-4" />}>
              <Text size="sm">{RESULT.saveFailed}</Text>
            </Alert>
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
            <Button variant="subtle" color="gray" onClick={props.onRestart}>
              {RESULT.restart}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
