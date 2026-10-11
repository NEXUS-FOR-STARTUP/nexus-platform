"use client";

 import { Badge, CopyButton, Group, Stack, Text, Tooltip } from "@mantine/core";
 import { Check, Copy } from "lucide-react";
import OverviewHero from "./OverviewHero";
import OverviewProgressStrip from "./OverviewProgressStrip";
import OverviewRecentReports from "./OverviewRecentReports";
import ZaloSupportCard from "./ZaloSupportCard";
import CaseOverviewPanel from "../CaseOverviewPanel";
import { buildNextActions } from "../../hooks/useNextActions";
import type { StageSummary } from "../../hooks/useStageSummaries";
import type { Case, DocumentWorkspace, RoundHistoryEntry, TeamFitReport } from "@/types";

 interface OverviewTabProps {
   caseId: string;
   caseData?: Case;
   stages?: StageSummary[];
   roundHistory?: RoundHistoryEntry[] | null;
   documentWorkspace?: DocumentWorkspace | null;
   intakeSnapshot?: unknown;
   teamFitReport?: TeamFitReport | null;
   onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
 }

 export default function OverviewTab({
   caseId,
   caseData,
   stages,
   roundHistory,
   documentWorkspace,
   intakeSnapshot,
   teamFitReport,
   onOpenStage,
 }: OverviewTabProps) {
  const actions = buildNextActions(stages);

  return (
    <Stack gap="lg">
      <div>
        <Text fw={700} size="xl">Tổng quan dự án</Text>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {caseData?.team_name ?? "Dự án của bạn"}
          </Text>
          {caseData?.case_code && (
            <CopyButton value={caseData.case_code} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Đã sao chép" : "Sao chép mã hồ sơ"} withArrow>
                  <Badge
                    size="sm"
                    variant="light"
                    color="gray"
                    leftSection={copied ? <Check size={12} /> : <Copy size={12} />}
                    onClick={copy}
                    style={{ cursor: "pointer" }}
                  >
                    {caseData.case_code}
                  </Badge>
                </Tooltip>
              )}
            </CopyButton>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          Xem việc cần làm tiếp theo và tiến độ bên dưới.
        </Text>
      </div>

      <OverviewHero action={actions[0] ?? null} onOpenStage={onOpenStage} />

      <OverviewProgressStrip caseId={caseId} stages={stages} />

      <OverviewRecentReports
        roundHistory={roundHistory}
        documentWorkspace={documentWorkspace}
        onOpenStage={onOpenStage}
      />

      {caseData && (
        <CaseOverviewPanel
          caseData={caseData}
          intakeSnapshot={intakeSnapshot}
          teamFitReport={teamFitReport}
        />
      )}

      <ZaloSupportCard />
    </Stack>
  );
}
