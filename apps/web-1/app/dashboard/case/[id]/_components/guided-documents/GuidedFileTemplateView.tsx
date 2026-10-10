"use client";

import React from "react";
import { Blockquote, Button } from "@mantine/core";
import { ChevronLeft, Download } from "lucide-react";
import type { FileTemplate } from "@repo/validation";

interface GuidedFileTemplateViewProps {
  template: FileTemplate;
  onBack: () => void;
}

export default function GuidedFileTemplateView({ template, onBack }: GuidedFileTemplateViewProps) {
  return (
    <div className="flex flex-col gap-5 w-full max-w-3xl">
      <div>
        <Button variant="subtle" size="compact-sm" leftSection={<ChevronLeft className="w-4 h-4" />} onClick={onBack}>
          Tất cả biểu mẫu
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-bold text-lg md:text-xl text-text-app">{template.title}</h2>
        <p className="text-xs text-text-muted">{template.description}</p>
      </div>

      <div>
        <Button
          component="a"
          href={template.file_url}
          download={template.file_name}
          leftSection={<Download className="w-4 h-4" />}
        >
          Tải file mẫu
        </Button>
      </div>

      <Blockquote color="blue" radius="md" p="md" style={{ whiteSpace: "pre-line" }}>
        {template.instructions}
      </Blockquote>
    </div>
  );
}
