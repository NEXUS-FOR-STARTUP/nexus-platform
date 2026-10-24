"use client";

import { useState } from "react";
import { Stack, Paper, Text } from "@mantine/core";
import FilterTabs from "../../ui/FilterTabs";
import { findStageBySlug } from "@app/shared/stages";
import StageHeader from "./StageHeader";
import StageDraftView from "./StageDraftView";
import StageFilesView from "./StageFilesView";
import StageResultsView from "./StageResultsView";
import StageGradingPanel from "./StageGradingPanel";
import StageDraftOnly from "./StageDraftOnly";
import { focusFirstAnswer } from "./focus-first-answer";
import StageStartGuide from "./StageStartGuide";
import AuditConfirmModal from "./AuditConfirmModal";
import type { AuditCheckpointCode, Cp2InputSource } from "@app/shared";
import { isSourceBasedStage } from "@/lib/audit-stage-ui";
import ServiceCheckoutModal from "../../billing/ServiceCheckoutModal";
import { useTriggerAudit } from "../../../hooks/useTriggerAudit";
import { useGuidedDrafts } from "../../../hooks/useGuidedDrafts";
import type { StageView } from "../stage-view";
import classes from "../workspace-layout.module.css";
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

  if (!stage) {
    return (
      <Paper p="xl" withBorder radius="md" style={{ textAlign: "center" }}>
        <Text fw={600} size="md">Không tìm thấy giai đoạn này</Text>
        <Text size="xs" c="dimmed" mt="xs">
          Vui lòng quay lại Hành trình và chọn một giai đoạn.
        </Text>
      </Paper>
    );
  }

  if (!stage.serviceType) {
    return <StageDraftOnly caseId={caseId} stage={stage} summary={summary} draftsApi={draftsApi} onBack={onBack} />;
  }

  const handleAuditClick = () => {
    if (creditsRemaining > 0) {
      setAuditConfirmOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  };
  const handleConfirmAudit = async (args: { scope: string; inputSource: Cp2InputSource; submissionType: "initial" | "resubmit"; changeSummary?: string; userNote?: string }) => {
    const note = {
      ...(args.changeSummary ? { change_summary: args.changeSummary } : {}),
      ...(args.userNote ? { user_note: args.userNote } : {}),
    };
    await triggerAudit({
      ...(isSourceBasedStage(stage.code)
        ? { checkpoint: stage.code as AuditCheckpointCode, scope: args.scope === "questionnaire" ? ("questionnaire" as const) : ("full" as const), input_source: args.inputSource, ...note }
        : Object.keys(note).length > 0
          ? { checkpoint: "CP1" as const, ...note }
          : {}),
      submission_type: args.submissionType,
    });
  };
  const handleAnswerClick = () => {
    onViewChange("draft");
    focusFirstAnswer();
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

      <StageStartGuide
        caseId={caseId}
        stageCode={stage.code}
        summary={summary}
        creditsRemaining={creditsRemaining}
        onAnswer={handleAnswerClick}
        onUpload={() => onViewChange("files")}
        onBuyCredits={() => setCheckoutOpen(true)}
        onAudit={handleAuditClick}
      />

      <StageGradingPanel
        caseId={caseId}
        checkpoint={stage.code}
        submissionType={summary?.status === "has_result" ? "resubmit" : "initial"}
        onViewResults={() => onViewChange("results")}
      />

      <FilterTabs
        ariaLabel="Nội dung giai đoạn"
        value={view}
        onChange={onViewChange}
        items={[
          { value: "draft", label: "Soạn thảo" },
          { value: "files", label: `Tài liệu (${summary?.file_count ?? 0})` },
          { value: "results", label: "Kết quả chấm" },
        ]}
      />

      <div key={view} className={classes.enter}>
        {view === "draft" && (
          <StageDraftView caseId={caseId} templateKey={templateKey} draftsApi={draftsApi} onBack={onBack} />
        )}

        {view === "files" && (
          <StageFilesView
            caseId={caseId}
            checkpointCode={stage.code}
            fileCount={summary?.file_count ?? 0}
            documentWorkspace={documentWorkspace}
          />
        )}

        {view === "results" && (
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
        )}
      </div>

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

      <ServiceCheckoutModal
        caseId={caseId}
        serviceCode={stage.serviceType}
        stageName={stage.name}
        opened={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPurchased={() => setAuditConfirmOpen(true)}
      />
    </Stack>
  );
}
