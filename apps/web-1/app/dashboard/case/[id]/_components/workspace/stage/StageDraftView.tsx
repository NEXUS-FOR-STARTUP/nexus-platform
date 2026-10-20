"use client";

import GuidedDocumentsEditor from "../../guided-documents/GuidedDocumentsEditor";
import type { useGuidedDrafts } from "../../../hooks/useGuidedDrafts";
import type { TemplateKey } from "@repo/validation";

interface StageDraftViewProps {
  caseId: string;
  templateKey: TemplateKey;
  draftsApi: ReturnType<typeof useGuidedDrafts>;
  onBack: () => void;
}

export default function StageDraftView({ caseId, templateKey, draftsApi, onBack }: StageDraftViewProps) {
  return (
    <GuidedDocumentsEditor
      caseId={caseId}
      templateKey={templateKey}
      draftsApi={draftsApi}
      onBack={onBack}
      hideBackButton
    />
  );
}
