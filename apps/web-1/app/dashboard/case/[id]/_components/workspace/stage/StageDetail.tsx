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
import { useStageAudit } from "../../../hooks/useStageAudit";
import { useGuidedDocuments } from "../../../hooks/useGuidedDocuments";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { TemplateKey } from "@repo/validation";

interface StageDetailProps {
  caseId: string;
  stageSlug: string;
  view: "draft" | "files" | "results";
  onViewChange: (view: "draft" | "files" | "results") => void;
  onBack: () => void;
  summary?: StageSummary;
  creditsRemaining: number;
}

export default function StageDetail({
  caseId,
  stageSlug,
  view,
  onViewChange,
  onBack,
  summary,
  creditsRemaining,
}: StageDetailProps) {
  const stage = findStageBySlug(stageSlug);
  const [auditConfirmOpen, setAuditConfirmOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { triggerAudit, isPending: isAuditPending } = useStageAudit(caseId);

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
      checkpoint: stage.code,
      scope,
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
        onExportDocx={generateDocx}
        isExportingDocx={isGenerating}
      />

      <Tabs value={view} onChange={(val) => onViewChange(val as "draft" | "files" | "results")}>
        <Tabs.List>
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
            fileCount={summary?.file_count ?? 0}
          />
        </Tabs.Panel>

        <Tabs.Panel value="results" pt="md">
          <StageResultsView
            caseId={caseId}
            summary={summary}
            onAudit={handleAuditClick}
            canAudit={creditsRemaining > 0}
          />
        </Tabs.Panel>
      </Tabs>

      <AuditConfirmModal
        stage={stage}
        opened={auditConfirmOpen}
        onClose={() => setAuditConfirmOpen(false)}
        onConfirm={handleConfirmAudit}
        creditsRemaining={creditsRemaining}
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
