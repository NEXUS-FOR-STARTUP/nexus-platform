"use client";

import React from "react";
import { SimpleGrid } from "@mantine/core";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import {
  FILE_TEMPLATE_KEYS,
  FILE_TEMPLATE_REGISTRY,
  TEMPLATE_KEYS,
  TEMPLATE_REGISTRY,
  type FileTemplateKey,
  type Template,
  type TemplateKey,
} from "@repo/validation";
import { useGuidedAnswers } from "../../hooks/useGuidedAnswers";
import type { AuditCheckpointCode } from "@app/shared";
import { AUDIT_STAGE_UI } from "@/lib/audit-stage-ui";
import { useCaseDetails } from "../../hooks/useCaseDetails";
import { useOpenCheckpoint } from "../../hooks/useOpenCheckpoint";
import GuidedFileTemplateCard from "./GuidedFileTemplateCard";
import GuidedTemplateCard from "./GuidedTemplateCard";

const GALLERY_SKELETON_CARDS = 8;

/** Checkpoints a student opens on demand (the template card starts the stage); CP1 is always open. */
const OPENABLE_TEMPLATES = { cp2: "CP2", cp3: "CP3" } as const satisfies Partial<Record<TemplateKey, AuditCheckpointCode>>;

interface GuidedTemplateGalleryProps {
  caseId: string;
  onOpen: (key: TemplateKey | FileTemplateKey) => void;
}

function countProgress(template: Template, answersMap: Record<string, string>) {
  const ids = template.phases.flatMap((p) => p.questions.map((q) => q.question_id));
  return {
    total: ids.length,
    answered: ids.filter((id) => answersMap[id]?.trim()).length,
  };
}

export default function GuidedTemplateGallery({ caseId, onOpen }: GuidedTemplateGalleryProps) {
  const { answersMap, isLoading } = useGuidedAnswers(caseId);
  const { documentWorkspace } = useCaseDetails(caseId);
  const { openCheckpoint, isOpening } = useOpenCheckpoint(caseId);
  const openCodes = new Set((documentWorkspace?.checkpoints ?? []).map((cp) => cp.checkpoint_code));

  if (isLoading) return <LoadingSkeleton variant="card" count={GALLERY_SKELETON_CARDS} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full" />;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-lg md:text-xl text-text-app">Soạn thảo tài liệu</h2>
        <p className="text-xs text-text-muted">
          Chọn biểu mẫu để bắt đầu trả lời từng câu hỏi và xuất file DOCX.
        </p>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
        {TEMPLATE_KEYS.map((key) => {
          const template = TEMPLATE_REGISTRY[key];
          const { answered, total } = countProgress(template, answersMap);
          const openCode = key in OPENABLE_TEMPLATES ? OPENABLE_TEMPLATES[key as keyof typeof OPENABLE_TEMPLATES] : undefined;
          const startCode = openCode !== undefined && !openCodes.has(openCode) ? openCode : undefined;
          return (
            <GuidedTemplateCard
              key={key}
              template={template}
              answered={answered}
              total={total}
              onOpen={startCode !== undefined ? () => openCheckpoint(startCode, { onSuccess: () => onOpen(key) }) : () => onOpen(key)}
              startLabel={startCode !== undefined ? AUDIT_STAGE_UI[startCode].openLabel : undefined}
              starting={startCode !== undefined && isOpening}
            />
          );
        })}
        {FILE_TEMPLATE_KEYS.map((key) => (
          <GuidedFileTemplateCard
            key={key}
            template={FILE_TEMPLATE_REGISTRY[key]}
            onOpen={() => onOpen(key)}
          />
        ))}
      </SimpleGrid>
    </div>
  );
}
