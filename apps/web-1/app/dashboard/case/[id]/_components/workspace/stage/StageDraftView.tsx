"use client";

import { Box } from "@mantine/core";
import GuidedDocumentsEditor from "../../guided-documents/GuidedDocumentsEditor";
import type { TemplateKey } from "@repo/validation";

interface StageDraftViewProps {
  caseId: string;
  templateKey: TemplateKey;
  onBack: () => void;
}

export default function StageDraftView({ caseId, templateKey, onBack }: StageDraftViewProps) {
  return (
    <Box>
      <GuidedDocumentsEditor
        caseId={caseId}
        templateKey={templateKey}
        onBack={onBack}
        hideBackButton
      />
    </Box>
  );
}
