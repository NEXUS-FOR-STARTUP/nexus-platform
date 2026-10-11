"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { Box, Group, Burger, Text } from "@mantine/core";
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

interface JourneyWorkspaceShellProps {
  caseId: string;
  caseData?: Case;
  intakeSnapshot?: unknown;
}

export default function JourneyWorkspaceShell({
  caseId,
  caseData,
  intakeSnapshot,
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
      {/* Mobile Header Bar */}
      <Box className="md:hidden flex items-center justify-between pb-3 border-b border-[var(--mantine-color-gray-2)] mb-4">
        <Group gap="xs">
          <Burger opened={mobileNavOpened} onClick={toggleMobileNav} size="sm" />
          <Text size="sm" fw={600}>
            {activeTab === "journey" && currentStage ? currentStage.name : "Không gian dự án"}
          </Text>
        </Group>
      </Box>

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

        <div className="flex-1 min-w-0">
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
