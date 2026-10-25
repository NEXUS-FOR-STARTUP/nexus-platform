"use client";

import React from "react";
import { Button } from "@mantine/core";
import { CaretLeft as ChevronLeft } from "@phosphor-icons/react";
import type { FileTemplate } from "@repo/validation";
import FileTemplateDownload from "./FileTemplateDownload";

interface GuidedFileTemplateViewProps {
  template: FileTemplate;
  onBack: () => void;
}

export default function GuidedFileTemplateView({ template, onBack }: GuidedFileTemplateViewProps) {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <Button variant="subtle" size="sm" leftSection={<ChevronLeft className="w-4 h-4" />} onClick={onBack}>
          Tất cả biểu mẫu
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-lg md:text-xl text-text-app">{template.title}</h2>
        <p className="text-xs text-text-muted">{template.description}</p>
      </div>

      <FileTemplateDownload template={template} />
    </div>
  );
}
