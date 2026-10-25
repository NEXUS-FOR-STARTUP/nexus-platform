"use client";

import { Stack } from "@mantine/core";
import type { StageDefinition } from "@app/shared/stages";
import type { TemplateKey } from "@repo/validation";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { GuidedDraftsApi } from "../../../hooks/useGuidedDrafts";
import StageHeader from "./StageHeader";
import StageDraftView from "./StageDraftView";

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
      <StageDraftView caseId={caseId} templateKey={templateKey} draftsApi={draftsApi} onBack={onBack} />
    </Stack>
  );
}
