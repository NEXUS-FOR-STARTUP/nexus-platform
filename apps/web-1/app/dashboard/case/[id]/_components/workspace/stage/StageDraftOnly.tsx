"use client";

import { Stack } from "@mantine/core";
import type { StageDefinition } from "@app/shared/stages";
import { financeTemplate, type FileTemplate, type TemplateKey } from "@repo/validation";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { GuidedDraftsApi } from "../../../hooks/useGuidedDrafts";
import FileTemplateDownload from "../../guided-documents/FileTemplateDownload";
import StageHeader from "./StageHeader";
import StageDraftView from "./StageDraftView";

/** Stage templates whose deliverable also includes a lecturer-provided file to download. */
const FILE_TEMPLATE_BY_STAGE_TEMPLATE: Partial<Record<TemplateKey, FileTemplate>> = { cp4: financeTemplate };

interface StageDraftOnlyProps {
  caseId: string;
  stage: StageDefinition;
  summary?: StageSummary;
  draftsApi: GuidedDraftsApi;
  onBack: () => void;
}

/** Stage without a grading service (financial plan, pitch deck): answers and a docx only. */
export default function StageDraftOnly({ caseId, stage, summary, draftsApi, onBack }: StageDraftOnlyProps) {
  const templateKey = stage.templateKey as TemplateKey;
  const fileTemplate = FILE_TEMPLATE_BY_STAGE_TEMPLATE[templateKey];
  return (
    <Stack gap="md">
      <StageHeader
        caseId={caseId}
        stage={stage}
        templateKey={templateKey}
        view="draft"
        summary={summary}
        draftsApi={draftsApi}
        onBack={onBack}
      />
      {fileTemplate && <FileTemplateDownload template={fileTemplate} />}
      <StageDraftView caseId={caseId} templateKey={templateKey} draftsApi={draftsApi} onBack={onBack} />
    </Stack>
  );
}
