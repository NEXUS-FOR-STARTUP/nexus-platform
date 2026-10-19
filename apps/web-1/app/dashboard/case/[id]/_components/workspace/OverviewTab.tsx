"use client";

import { useRouter } from "next/navigation";
import { isCaseContactComplete } from "@repo/validation";
import { buildNextActions } from "../../hooks/useNextActions";
import { useCaseDetails } from "../../hooks/useCaseDetails";
import type { StageSummary } from "../../hooks/useStageSummaries";
import type { Case, DocumentWorkspace, RoundHistoryEntry, TeamFitReport } from "@/types";
import ContactNextStepCard from "./ContactNextStepCard";
import OverviewHeader from "./OverviewHeader";
import OverviewHero from "./OverviewHero";
import OverviewJourneyList from "./OverviewJourneyList";
import OverviewProfileFold from "./OverviewProfileFold";
import OverviewRecentReports from "./OverviewRecentReports";
import OverviewIdeaGuideAlert from "../overview/OverviewIdeaGuideAlert";
import s from "./overview.module.css";

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
  const router = useRouter();
  const { contact } = useCaseDetails(caseId);
  const actions = buildNextActions(stages);
  const contactComplete = isCaseContactComplete(contact);
  const openSettings = () => router.push(`/dashboard/case/${caseId}?tab=settings`);

  return (
    <div className={s.page}>
      <OverviewHeader teamName={caseData?.team_name ?? undefined} caseCode={caseData?.case_code ?? undefined} />

      <ContactNextStepCard contact={contact} onOpenSettings={openSettings} />

      {contactComplete && <OverviewHero action={actions[0] ?? null} onOpenStage={onOpenStage} />}

      {contactComplete && !(actions[0]?.stageSlug === "y-tuong" && actions[0].view === "draft") && (
        <OverviewIdeaGuideAlert onOpenStage={onOpenStage} />
      )}

      <OverviewJourneyList stages={stages} onOpenStage={onOpenStage} />

      <OverviewRecentReports roundHistory={roundHistory} documentWorkspace={documentWorkspace} onOpenStage={onOpenStage} />

      {caseData && (
        <OverviewProfileFold
          caseData={caseData}
          intakeSnapshot={{ ...(intakeSnapshot as Record<string, unknown> | null), contact }}
          teamFitReport={teamFitReport}
          onOpenSettings={openSettings}
        />
      )}
    </div>
  );
}
