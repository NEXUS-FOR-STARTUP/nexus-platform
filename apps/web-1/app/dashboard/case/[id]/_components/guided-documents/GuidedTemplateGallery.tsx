"use client";

import React from "react";
import { Loader, SimpleGrid } from "@mantine/core";
import { TEMPLATE_KEYS, TEMPLATE_REGISTRY, type Template, type TemplateKey } from "@repo/validation";
import { useGuidedAnswers } from "../../hooks/useGuidedAnswers";
import GuidedTemplateCard from "./GuidedTemplateCard";

// CP3 đã có đủ câu hỏi nhưng chưa mở cho người dùng. Bỏ khóa này khỏi danh sách khi sẵn sàng mở.
const COMING_SOON_TEMPLATES: readonly TemplateKey[] = ["cp3"];

interface GuidedTemplateGalleryProps {
  caseId: string;
  onOpen: (key: TemplateKey) => void;
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

  if (isLoading) {
    return (
      <div className="bg-surface-app border border-border-app rounded-xl p-12 flex flex-col items-center justify-center gap-3">
        <Loader size="md" color="blue" />
        <p className="text-sm text-text-muted">Đang tải biểu mẫu hướng dẫn...</p>
      </div>
    );
  }

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
          return (
            <GuidedTemplateCard
              key={key}
              template={template}
              answered={answered}
              total={total}
              onOpen={() => onOpen(key)}
              comingSoon={COMING_SOON_TEMPLATES.includes(key)}
            />
          );
        })}
      </SimpleGrid>
    </div>
  );
}
