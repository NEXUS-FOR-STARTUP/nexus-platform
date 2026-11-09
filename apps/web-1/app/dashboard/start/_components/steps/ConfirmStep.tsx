"use client";

import { StepShell } from "../StepShell";
import { ConfirmLabels, type LabelTags } from "../ConfirmLabels";
import { CONFIRM_LEAD_ASSETS, CONFIRM_LEAD_IDEA, WHY } from "../../_data/copy";

interface ConfirmStepProps {
  kind: "assets" | "idea";
  catalog: ReadonlyArray<{ id: string; label: string }>;
  suggested: string[];
  aiOk: boolean;
  tags: LabelTags;
  onTags: (next: LabelTags) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
}

export function ConfirmStep({ kind, catalog, suggested, aiOk, tags, onTags, error, onBack, onNext }: ConfirmStepProps) {
  return (
    <StepShell
      title={kind === "assets" ? "AI đọc được những điều này, đúng không?" : "AI hiểu ý tưởng của bạn thế nào?"}
      why={WHY.confirm}
      lead={kind === "assets" ? CONFIRM_LEAD_ASSETS : CONFIRM_LEAD_IDEA}
      error={error}
      onBack={onBack}
      onNext={onNext}
      nextLabel={kind === "assets" ? "Tiếp" : "Xem kết quả"}
    >
      <ConfirmLabels catalog={catalog} suggested={suggested} aiOk={aiOk} tags={tags} onTags={onTags} />
    </StepShell>
  );
}
