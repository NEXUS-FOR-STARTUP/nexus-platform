"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import type { StageDefinition } from "@app/shared/stages";
import { TEMPLATE_REGISTRY, type TemplateKey } from "@repo/validation";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import { Button } from "../../ui/Button";
import type { StageView } from "../stage-view";
import StageActionsMenu from "./StageActionsMenu";
import s from "./StageHeader.module.css";

interface StageHeaderProps {
  caseId: string;
  stage: StageDefinition;
  templateKey: TemplateKey;
  view: StageView;
  summary?: StageSummary;
  creditsRemaining: number;
  draftQuestionIds: string[];
  onBack: () => void;
  onAudit: () => void;
  onBuyCredits: () => void;
}

export default function StageHeader({
  caseId,
  stage,
  templateKey,
  view,
  summary,
  creditsRemaining,
  draftQuestionIds,
  onBack,
  onAudit,
  onBuyCredits,
}: StageHeaderProps) {
  const isGrading = summary?.status === "grading";
  const hasResult = summary?.status === "has_result";
  const questionCount = TEMPLATE_REGISTRY[stage.templateKey]?.phases.flatMap((p) => p.questions).length ?? 0;
  const hasCredits = creditsRemaining > 0;
  const meta = [
    `${summary?.answered_count ?? 0}/${questionCount} câu`,
    `${summary?.file_count ?? 0} tệp`,
    hasCredits ? `còn ${creditsRemaining} lượt chấm` : "hết lượt chấm",
  ].join(" · ");

  return (
    <div className={s.root}>
      <p className={s.crumb}>
        <button type="button" className={s.crumbLink} onClick={onBack}>
          Hành trình
        </button>{" "}
        / <span>{stage.name}</span>
      </p>

      <div className={s.head}>
        <div>
          <h1 className={s.title}>
            {stage.name}
            {isGrading ? (
              <StatusChip tone="warn">Đang chấm</StatusChip>
            ) : hasResult ? (
              <StatusChip tone="ok">Đã có kết quả</StatusChip>
            ) : null}
          </h1>
          <p className={s.note}>{meta}</p>
        </div>

        <div className={s.actions}>
          {view === "draft" && (
            <StageActionsMenu caseId={caseId} templateKey={templateKey} draftQuestionIds={draftQuestionIds} />
          )}
          {hasCredits ? (
            <Button disabled={isGrading} onClick={onAudit}>
              {hasResult ? "Chấm lại" : "Chấm bài"}
            </Button>
          ) : (
            <Button variant="quiet" onClick={onBuyCredits}>Mua lượt chấm</Button>
          )}
        </div>
      </div>
    </div>
  );
}
