"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { Box, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import JourneySidebar, { type WorkspaceTabKey } from "./JourneySidebar";
import JourneyMobileNav from "./JourneyMobileNav";
import OverviewTab from "./OverviewTab";
import JourneyTab from "./JourneyTab";
import StageDetail from "./stage/StageDetail";
import BillingTab from "../billing/BillingTab";
import ActivityTimeline from "../ActivityTimeline";
import TabCaseSettings from "../TabCaseSettings";
import { useStageSummaries } from "../../hooks/useStageSummaries";
import { findStageBySlug } from "@app/shared/stages";
import type { Case } from "@/types";
import type { DocumentWorkspace, RoundHistoryEntry } from "@/types/case";

interface JourneyWorkspaceShellProps {
  caseId: string;
  caseData?: Case;
  intakeSnapshot?: unknown;
  documentWorkspace?: DocumentWorkspace | null;
  roundHistory?: RoundHistoryEntry[] | null;
}

export default function JourneyWorkspaceShell({
  caseId,
  caseData,
  intakeSnapshot,
  documentWorkspace,
  roundHistory,
}: JourneyWorkspaceShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") || "overview";
  const stageSlugParam = searchParams.get("stage") || "";
  const viewParam = (searchParams.get("view") || "draft") as "draft" | "files" | "results";

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

  const handleOpenStage = (slug: string, view: "draft" | "files" | "results" = "draft") => {
    router.push(`/dashboard/case/${caseId}?tab=journey&stage=${slug}&view=${view}`);
  };

  const handleBackToJourney = () => {
    router.push(`/dashboard/case/${caseId}?tab=journey`);
  };

  const handleViewChange = (newView: "draft" | "files" | "results") => {
    if (stageSlugParam) {
      router.push(`/dashboard/case/${caseId}?tab=journey&stage=${stageSlugParam}&view=${newView}`);
    }
  };

  const currentStage = stageSlugParam ? findStageBySlug(stageSlugParam) : undefined;
  const currentSummary = currentStage
    ? stageSummariesData?.stages?.find((s) => s.checkpoint_code === currentStage.code)
    : undefined;
  const stageCredits = currentStage?.serviceType ? caseData?.credit_balances?.[currentStage.serviceType] ?? 0 : 0;

  return (
    <Box className="w-full">
      <JourneyMobileNav
        opened={mobileNavOpened}
        onClose={closeMobileNav}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <div className="flex gap-6">
        <div className="hidden md:block">
          <JourneySidebar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="flex-1 min-w-0 px-4 pb-4 pt-16 md:p-6 bg-gray-50/70">
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label="Mở menu dự án"
            className="fixed top-20 left-4 z-50 md:hidden w-12 h-12 rounded-full border-2 border-blue-500 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between">
              <span
                className={`block h-0.5 bg-blue-600 rounded transition-transform duration-200 origin-center ${
                  mobileNavOpened ? "rotate-45 translate-y-[7px]" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-blue-600 rounded transition-opacity duration-200 ${
                  mobileNavOpened ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-blue-600 rounded transition-transform duration-200 origin-center ${
                  mobileNavOpened ? "-rotate-45 -translate-y-[7px]" : ""
                }`}
              />
            </div>
          </button>

          {activeTab === "overview" && (
            <OverviewTab
              caseData={caseData}
              stages={stageSummariesData?.stages}
              onOpenStage={handleOpenStage}
              onEditProfile={() => router.push(`/dashboard/case/${caseId}/profile`)}
            />
          )}

          {activeTab === "journey" && (
            stageSlugParam && currentStage ? (
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
              orders={caseData?.orders}
              isLoading={isStagesLoading}
            />
          )}

          {activeTab === "timeline" && <ActivityTimeline caseData={caseData!} />}

          {activeTab === "settings" && <TabCaseSettings caseData={caseData!} intakeSnapshot={intakeSnapshot} />}
        </div>
      </div>
    </Box>
  );
}
