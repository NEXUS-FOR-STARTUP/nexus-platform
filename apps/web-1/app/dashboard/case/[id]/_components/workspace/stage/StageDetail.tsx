"use client";

import { useState } from "react";
import { Stack, Tabs, Paper, Text } from "@mantine/core";
import { FileEdit, FolderUp, Award } from "lucide-react";
import { findStageBySlug } from "@app/shared/stages";
import StageHeader from "./StageHeader";
import StageDraftView from "./StageDraftView";
import StageFilesView from "./StageFilesView";
import StageResultsView from "./StageResultsView";
import AuditConfirmModal from "./AuditConfirmModal";
import ServiceCheckoutModal from "../../billing/ServiceCheckoutModal";
import { useTriggerAudit } from "../../../hooks/useTriggerAudit";
import { useGuidedDocuments } from "../../../hooks/useGuidedDocuments";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { TemplateKey } from "@repo/validation";
import type { Case, DocumentWorkspace, RoundHistoryEntry } from "@/types";

interface StageDetailProps {
  caseId: string;
  stageSlug: string;
  view: "draft" | "files" | "results";
  onViewChange: (view: "draft" | "files" | "results") => void;
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
  const { generateDocx, isGenerating } = useGuidedDocuments(caseId, templateKey);

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

  const handleConfirmAudit = async (scope: string) => {
    await triggerAudit({
      checkpoint: stage.code as "CP1" | "CP2",
      scope: scope === "questionnaire" ? "questionnaire" : "full",
      submission_type: summary?.status === "has_result" ? "resubmit" : "initial",
    });
  };

  return (
    <Stack gap="md">
      <StageHeader
        stage={stage}
        summary={summary}
        creditsRemaining={creditsRemaining}
        onBack={onBack}
        onAudit={handleAuditClick}
        onBuyCredits={() => setCheckoutOpen(true)}
      />

      <Tabs value={view} onChange={(val) => onViewChange(val as "draft" | "files" | "results")} variant="pills" radius="md">
        <Tabs.List justify="flex-start">
          <Tabs.Tab value="draft" leftSection={<FileEdit size={16} />}>
            Soạn thảo
          </Tabs.Tab>
          <Tabs.Tab value="files" leftSection={<FolderUp size={16} />}>
            Tài liệu nộp ({summary?.file_count ?? 0})
          </Tabs.Tab>
          <Tabs.Tab value="results" leftSection={<Award size={16} />}>
            Kết quả chấm
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="draft" pt="md">
          <StageDraftView
            caseId={caseId}
            templateKey={templateKey}
            onBack={onBack}
          />
        </Tabs.Panel>

        <Tabs.Panel value="files" pt="md">
          <StageFilesView
            caseId={caseId}
            checkpointCode={stage.code}
            checkpointId={checkpointId}
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
