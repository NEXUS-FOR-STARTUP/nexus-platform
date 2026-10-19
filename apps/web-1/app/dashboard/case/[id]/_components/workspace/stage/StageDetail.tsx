"use client";

import { useState } from "react";
import { Stack, Tabs, Paper, Text } from "@mantine/core";
import { UNDERLINE_TABS_CLASSES } from "@/components/ui/underline-tabs";
import { findStageBySlug } from "@app/shared/stages";
import StageHeader from "./StageHeader";
import StageDraftView from "./StageDraftView";
import StageFilesView from "./StageFilesView";
import StageResultsView from "./StageResultsView";
import StageGradingPanel from "./StageGradingPanel";
import AuditConfirmModal from "./AuditConfirmModal";
import type { Cp2InputSource } from "@app/shared";
import ServiceCheckoutModal from "../../billing/ServiceCheckoutModal";
import { useTriggerAudit } from "../../../hooks/useTriggerAudit";
import { useGuidedDrafts } from "../../../hooks/useGuidedDrafts";
import { parseStageView, type StageView } from "../stage-view";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { TemplateKey } from "@repo/validation";
import type { Case, DocumentWorkspace, RoundHistoryEntry } from "@/types";

interface StageDetailProps {
  caseId: string;
  stageSlug: string;
  view: StageView;
  onViewChange: (view: StageView) => void;
  onBack: () => void;
  summary?: StageSummary;
  creditsRemaining: number;
  documentWorkspace?: DocumentWorkspace | null;
  roundHistory?: RoundHistoryEntry[] | null;
  caseData?: Case;
}

export default function StageDetail({
  caseId,
  stageSlug,
  view,
  onViewChange,
  onBack,
  summary,
  creditsRemaining,
  documentWorkspace,
  roundHistory,
  caseData,
}: StageDetailProps) {
  const stage = findStageBySlug(stageSlug);
  const checkpointId = stage
    ? documentWorkspace?.checkpoints.find((cp) => cp.checkpoint_code === stage.code)?.checkpoint_id
    : undefined;
  const [auditConfirmOpen, setAuditConfirmOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { triggerAudit, isTriggering: isAuditPending } = useTriggerAudit(caseId);

  const templateKey = (stage?.templateKey ?? "cp1") as TemplateKey;
  // Single source of unsaved drafts: the editor edits them, the header menu syncs around them.
  const draftsApi = useGuidedDrafts(caseId);

  if (!stage || !stage.available) {
    return (
      <Paper p="xl" withBorder radius="md" style={{ textAlign: "center" }}>
        <Text fw={600} size="md">Giai đoạn này sắp ra mắt</Text>
        <Text size="xs" c="dimmed" mt="xs">
          Nội dung đang được hoàn thiện. Vui lòng quay lại Hành trình để tiếp tục các giai đoạn khả dụng.
        </Text>
      </Paper>
    );
  }

  const handleAuditClick = () => {
    if (creditsRemaining > 0) {
      setAuditConfirmOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  };
  const handleConfirmAudit = async (args: { scope: string; inputSource: Cp2InputSource; submissionType: "initial" | "resubmit"; changeSummary?: string; userNote?: string }) => {
    await triggerAudit({
      ...(stage.code === "CP2"
        ? { checkpoint: "CP2" as const, scope: args.scope === "questionnaire" ? ("questionnaire" as const) : ("full" as const), input_source: args.inputSource, ...(args.changeSummary ? { change_summary: args.changeSummary } : {}), ...(args.userNote ? { user_note: args.userNote } : {}) }
        : {}),
      submission_type: args.submissionType,
    });
  };

  return (
    <Stack gap="md">
      <StageHeader
        caseId={caseId}
        stage={stage}
        templateKey={templateKey}
        view={view}
        draftQuestionIds={Object.keys(draftsApi.drafts)}
        summary={summary}
        creditsRemaining={creditsRemaining}
        onBack={onBack}
        onAudit={handleAuditClick}
        onBuyCredits={() => setCheckoutOpen(true)}
      />

      <StageGradingPanel
        caseId={caseId}
        checkpoint={stage.code}
        submissionType={summary?.status === "has_result" ? "resubmit" : "initial"}
        onViewResults={() => onViewChange("results")}
      />

      <Tabs value={view} onChange={(val) => onViewChange(parseStageView(val))} classNames={UNDERLINE_TABS_CLASSES}>
        <Tabs.List>
          <Tabs.Tab value="draft">
            Soạn thảo
          </Tabs.Tab>
          <Tabs.Tab value="files">
            Tài liệu ({summary?.file_count ?? 0})
          </Tabs.Tab>
          <Tabs.Tab value="results">
            Kết quả chấm
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="draft" pt="md">
          <StageDraftView
            caseId={caseId}
            templateKey={templateKey}
            draftsApi={draftsApi}
            onBack={onBack}
          />
        </Tabs.Panel>

        <Tabs.Panel value="files" pt="md">
          <StageFilesView
            caseId={caseId}
            checkpointCode={stage.code}
            fileCount={summary?.file_count ?? 0}
            documentWorkspace={documentWorkspace}
          />
        </Tabs.Panel>

        <Tabs.Panel value="results" pt="md">
          <StageResultsView
            caseId={caseId}
            summary={summary}
            roundHistory={roundHistory}
            checkpointId={checkpointId}
            projectName={caseData?.team_name || undefined}
            caseCode={caseData?.case_code || undefined}
            onGoDraft={() => onViewChange("draft")}
            onGoFiles={() => onViewChange("files")}
            onAudit={handleAuditClick}
          />
        </Tabs.Panel>
      </Tabs>

      <AuditConfirmModal
        stage={stage}
        opened={auditConfirmOpen}
        onClose={() => setAuditConfirmOpen(false)}
        onConfirm={handleConfirmAudit}
        creditsRemaining={creditsRemaining}
        summary={summary}
        onGoFiles={() => onViewChange("files")}
        isLoading={isAuditPending}
      />

      {stage.serviceType && (
        <ServiceCheckoutModal
          caseId={caseId}
          serviceCode={stage.serviceType}
          stageName={stage.name}
          opened={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onPurchased={() => setAuditConfirmOpen(true)}
        />
      )}
    </Stack>
  );
}
