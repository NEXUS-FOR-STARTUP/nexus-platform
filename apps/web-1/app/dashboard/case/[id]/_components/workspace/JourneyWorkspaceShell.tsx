"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { List as Menu, X } from "@phosphor-icons/react";
import { Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import JourneySidebar, { type WorkspaceTabKey } from "./JourneySidebar";
import JourneyMobileNav from "./JourneyMobileNav";
import WorkspaceMain from "./WorkspaceMain";
import OverviewTab from "./OverviewTab";
import JourneyTab from "./JourneyTab";
import StageDetail from "./stage/StageDetail";
import { parseStageView, type StageView } from "./stage-view";
import BillingTab from "../billing/BillingTab";
import ActivityTimeline from "../ActivityTimeline";
import TabCaseSettings from "../TabCaseSettings";
import { useStageSummaries } from "../../hooks/useStageSummaries";
import { findStageBySlug } from "@app/shared/stages";
import type { Case } from "@/types";
import type { DocumentWorkspace, RoundHistoryEntry, TeamFitReport } from "@/types/case";
import classes from "./workspace-layout.module.css";

interface JourneyWorkspaceShellProps {
  caseId: string;
  caseData?: Case;
  intakeSnapshot?: unknown;
  teamFitReport?: TeamFitReport | null;
  documentWorkspace?: DocumentWorkspace | null;
  roundHistory?: RoundHistoryEntry[] | null;
}

export default function JourneyWorkspaceShell({
  caseId,
  caseData,
  intakeSnapshot,
  teamFitReport,
  documentWorkspace,
  roundHistory,
}: JourneyWorkspaceShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") || "overview";
  const stageSlugParam = searchParams.get("stage") || "";
  const viewParam = parseStageView(searchParams.get("view"));

  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure(false);
  const { data: stageSummariesData, isLoading: isStagesLoading } = useStageSummaries(caseId);

  // Map legacy tab URLs to new workspace tabs
  const activeTab: WorkspaceTabKey =
    rawTab === "guided" || rawTab === "journey"
      ? "journey"
      : rawTab === "credits" || rawTab === "billing"
        ? "billing"
        : rawTab === "timeline"
          ? "timeline"
          : rawTab === "settings"
            ? "settings"
            : "overview";

  const handleTabChange = (key: WorkspaceTabKey) => {
    router.push(`/dashboard/case/${caseId}?tab=${key}`);
  };

  const handleOpenStage = (slug: string, view: StageView = "draft") => {
    router.push(`/dashboard/case/${caseId}?tab=journey&stage=${slug}&view=${view}`);
  };

  const handleBackToJourney = () => {
    router.push(`/dashboard/case/${caseId}?tab=journey`);
  };

  const handleViewChange = (newView: StageView) => {
    if (stageSlugParam) {
      router.push(`/dashboard/case/${caseId}?tab=journey&stage=${stageSlugParam}&view=${newView}`);
    }
  };

  const currentStage = stageSlugParam ? findStageBySlug(stageSlugParam) : undefined;
  const currentSummary = currentStage
    ? stageSummariesData?.stages?.find((s) => s.checkpoint_code === currentStage.code)
    : undefined;
  const stageCredits = currentStage?.serviceType ? caseData?.credit_balances?.[currentStage.serviceType] ?? 0 : 0;

  const showStageDetail = activeTab === "journey" && Boolean(stageSlugParam && currentStage);
  const width = showStageDetail ? "wide" : activeTab === "timeline" || activeTab === "settings" ? "narrow" : "col";

  return (
    <div className={classes.layout}>
      <JourneyMobileNav
        opened={mobileNavOpened}
        onClose={closeMobileNav}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className={classes.sidebar}>
        <JourneySidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <button
        type="button"
        onClick={toggleMobileNav}
        aria-label={mobileNavOpened ? "Đóng menu dự án" : "Mở menu dự án"}
        aria-expanded={mobileNavOpened}
        className={classes.fab}
      >
        {mobileNavOpened ? <X size={20} /> : <Menu size={20} />}
      </button>

      <WorkspaceMain width={width}>
        {activeTab === "overview" && (
          <OverviewTab
            caseId={caseId}
            caseData={caseData}
            stages={stageSummariesData?.stages}
            roundHistory={roundHistory}
            documentWorkspace={documentWorkspace}
            intakeSnapshot={intakeSnapshot}
            teamFitReport={teamFitReport}
            onOpenStage={handleOpenStage}
          />
        )}

        {activeTab === "journey" && (
          showStageDetail ? (
            <StageDetail
              caseId={caseId}
              stageSlug={stageSlugParam}
              view={viewParam}
              onViewChange={handleViewChange}
              onBack={handleBackToJourney}
              summary={currentSummary}
              creditsRemaining={stageCredits}
              documentWorkspace={documentWorkspace}
              roundHistory={roundHistory}
              caseData={caseData}
            />
          ) : (
            <JourneyTab
              stages={stageSummariesData?.stages}
              balances={caseData?.credit_balances}
              onOpenStage={handleOpenStage}
            />
          )
        )}

        {activeTab === "billing" && (
          <BillingTab
            caseId={caseId}
            balances={caseData?.credit_balances}
            creditLedger={caseData?.credit_ledger}
            isLoading={isStagesLoading}
          />
        )}

        {activeTab === "timeline" && (
          <Stack gap="xs">
            <div>
              <Text fw={700} size="xl">Lịch sử hoạt động</Text>
              <Text size="sm" c="dimmed">Mọi thay đổi trạng thái, lần chấm và cập nhật của dự án theo thời gian.</Text>
            </div>
            <ActivityTimeline caseData={caseData!} />
          </Stack>
        )}

        {activeTab === "settings" && <TabCaseSettings caseData={caseData!} intakeSnapshot={intakeSnapshot} />}
      </WorkspaceMain>
    </div>
  );
}
