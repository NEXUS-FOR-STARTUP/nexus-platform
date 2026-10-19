"use client";

import { Anchor, Breadcrumbs, Button, Group, Stack, Text } from "@mantine/core";
import { Sparkle as Sparkles } from "@phosphor-icons/react";
import BuyButton from "@/components/ui/BuyButton";
import { StatusChip } from "@/components/ui/StatusChip";
import type { StageDefinition } from "@app/shared/stages";
import { TEMPLATE_REGISTRY, type TemplateKey } from "@repo/validation";
import type { StageSummary } from "../../../hooks/useStageSummaries";
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

  return (
    <Stack gap="xs">
      <Breadcrumbs separator="/" aria-label="Đường dẫn">
        <Anchor component="button" type="button" size="sm" onClick={onBack}>
          Hành trình
        </Anchor>
        <Text size="sm" c="dimmed">{stage.name}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Stack gap={2}>
          <Group gap="sm" align="center">
            <h1 className={s.title}>{stage.name}</h1>
            {isGrading ? (
              <StatusChip tone="warn">Đang chấm</StatusChip>
            ) : hasResult ? (
              <StatusChip tone="ok">Đã có kết quả</StatusChip>
            ) : null}
          </Group>
          <p className={s.note}>
            {summary?.answered_count ?? 0}/{questionCount} câu đã trả lời
            <br />
            {summary?.file_count ?? 0} tệp đính kèm
            <br />
            {creditsRemaining > 0 ? `Còn ${creditsRemaining} lượt chấm` : "Hết lượt chấm"}
          </p>
        </Stack>

        <Group gap="xs">
          {creditsRemaining > 0 ? (
            <Button size="sm" leftSection={<Sparkles size={16} />} disabled={isGrading} onClick={onAudit}>
              {hasResult ? "Chấm lại" : "Chấm bài"}
            </Button>
          ) : (
            <BuyButton size="sm" onClick={onBuyCredits}>
              Mua lượt chấm
            </BuyButton>
          )}
          {view === "draft" && (
            <StageActionsMenu caseId={caseId} templateKey={templateKey} draftQuestionIds={draftQuestionIds} />
          )}
        </Group>
      </Group>
    </Stack>
  );
}
