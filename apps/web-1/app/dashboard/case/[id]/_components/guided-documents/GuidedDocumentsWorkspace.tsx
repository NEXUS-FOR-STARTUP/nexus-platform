"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FILE_TEMPLATE_REGISTRY,
  isFileTemplateKey,
  isTemplateKey,
  type FileTemplateKey,
  type TemplateKey,
} from "@repo/validation";
import GuidedDocumentsEditor from "./GuidedDocumentsEditor";
import GuidedFileTemplateView from "./GuidedFileTemplateView";
import GuidedTemplateGallery from "./GuidedTemplateGallery";

interface GuidedDocumentsWorkspaceProps {
  caseId: string;
}

export default function GuidedDocumentsWorkspace({
  caseId,
}: GuidedDocumentsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTemplate = searchParams.get("template");

  // push (not replace) so the browser Back button returns to the gallery.
  const navigate = (key: TemplateKey | FileTemplateKey | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "guided");
    if (key) params.set("template", key);
    else params.delete("template");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (isTemplateKey(rawTemplate)) {
    return (
      <GuidedDocumentsEditor
        key={rawTemplate}
        caseId={caseId}
        templateKey={rawTemplate}
        onBack={() => navigate(null)}
      />
    );
  }

  if (isFileTemplateKey(rawTemplate)) {
    return <GuidedFileTemplateView template={FILE_TEMPLATE_REGISTRY[rawTemplate]} onBack={() => navigate(null)} />;
  }

  return <GuidedTemplateGallery caseId={caseId} onOpen={navigate} />;
}
