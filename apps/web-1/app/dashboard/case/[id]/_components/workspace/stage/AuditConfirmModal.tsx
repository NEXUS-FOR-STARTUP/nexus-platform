"use client";

import { Modal, Stack, Group } from "@mantine/core";
import { Button } from "../../ui/Button";
import { useState } from "react";
import type { StageDefinition } from "@app/shared/stages";
import type { Cp2InputSource } from "@app/shared";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import AuditStepSources from "./AuditStepSources";
import { hasStageInput } from "./stage-input";
import AuditStepOptions, { type Cp2Scope, type RunKind } from "./AuditStepOptions";

interface AuditConfirmModalProps {
  stage: StageDefinition;
  opened: boolean;
  onClose: () => void;
  onConfirm: (args: { scope: string; inputSource: Cp2InputSource; submissionType: "initial" | "resubmit"; changeSummary?: string; userNote?: string }) => void;
  creditsRemaining: number;
  summary?: StageSummary;
  missingMandatoryCount?: number;
  isLoading?: boolean;
  /** Jump to the files tab (modal closes first). Keeps upload in StageFilesView only. */
  onGoFiles?: () => void;
}

const SOURCE_PRIORITY: readonly Cp2InputSource[] = ["both", "answers", "files"];
const SCOPE_PRIORITY: readonly Cp2Scope[] = ["full", "questionnaire"];

/**
 * Single grading entry point. Step 1 = what the team has (answers / files).
 * Step 2 = accordion of 4 compact cards (what to read, how far, which run, note to AI) + confirm.
 * Either input alone is enough: a team with detailed files skips the questions,
 * a team with no files grades on answers. "Both" needs both to pass.
 * Readiness comes from the server summary so the client never re-implements the bar.
 * Questionnaire has no resubmit plan, so picking it forces a fresh run.
 */
export default function AuditConfirmModal({
  stage,
  opened,
  onClose,
  onConfirm,
  creditsRemaining,
  summary,
  missingMandatoryCount = 0,
  isLoading = false,
  onGoFiles,
}: AuditConfirmModalProps) {
  const isCp2 = stage.code === "CP2";
  // No effect syncs these: the defaults are derived below and a manual pick is
  // remembered as an override, so readiness changing under it can't reset it.
  const [scopeOverride, setScopeOverride] = useState<Cp2Scope | null>(null);
  const [sourceOverride, setSourceOverride] = useState<Cp2InputSource | null>(null);
  const [submissionTypeOverride, setSubmissionTypeOverride] = useState<RunKind | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [userNote, setUserNote] = useState("");
  const [step, setStep] = useState(1);

  const answeredCount = summary?.answered_count ?? 0;
  const fileCount = summary?.file_count ?? 0;
  const readyFull = summary?.answers_ready_full ?? false;
  const readyQuestionnaire = summary?.answers_ready_questionnaire ?? false;
  const hasFiles = fileCount > 0;

  const answersReadyFor = (sc: Cp2Scope) => (sc === "questionnaire" ? readyQuestionnaire : readyFull);
  const sourceReady = (src: Cp2InputSource, sc: Cp2Scope) => {
    if (src === "files") return hasFiles;
    if (src === "answers") return answersReadyFor(sc);
    return hasFiles && answersReadyFor(sc);
  };
  const handleScopeChange = (next: Cp2Scope) => {
    setScopeOverride(next);
    if (next === "questionnaire") setSubmissionTypeOverride("initial");
  };

  // Derived defaults (no effect): the richest option the current input supports,
  // and "resubmit" once a result exists. A manual pick always wins.
  const recommended = (() => {
    if (!isCp2) return null;
    for (const src of SOURCE_PRIORITY) {
      const sc = SCOPE_PRIORITY.find((candidate) => sourceReady(src, candidate));
      if (sc) return { source: src, scope: sc };
    }
    return null;
  })();
  const scope = scopeOverride ?? recommended?.scope ?? "full";
  const source = sourceOverride ?? recommended?.source ?? "answers";
  const hasResult = summary?.status === "has_result";
  // CP2 re-grades by default once a result exists. CP1's usual second run is the team adding a forgotten file, so it stays a fresh run unless picked.
  const submissionType = submissionTypeOverride ?? (isCp2 && hasResult ? "resubmit" : "initial");

  // CP1 has no CP2-style readiness bar, but no stage is ever graded on nothing:
  // zero answers AND zero files is a dead end in both checkpoints.
  const hasAnswers = isCp2 ? readyFull || readyQuestionnaire : answeredCount > 0;
  const blocked = !hasStageInput(isCp2, summary);
  const canConfirm = !blocked && (!isCp2 || sourceReady(source, scope));

  const handleClose = () => {
    setStep(1);
    setChangeSummary("");
    setUserNote("");
    onClose();
  };

  const handleConfirm = () => {
    // Questionnaire has no resubmit plan, and CP1 can only compare with a result that exists:
    // a stale resubmit selection still grades as a fresh run.
    const effectiveType = (isCp2 && scope === "questionnaire") || (!isCp2 && !hasResult) ? "initial" : submissionType;
    onConfirm({
      scope,
      inputSource: source,
      submissionType: effectiveType,
      ...(effectiveType === "resubmit" && changeSummary.trim() ? { changeSummary: changeSummary.trim() } : {}),
      ...(userNote.trim() ? { userNote: userNote.trim() } : {}),
    });
    handleClose();
  };

  const handleGoFiles = () => {
    handleClose();
    onGoFiles?.();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={`Xác nhận chấm bài - ${stage.name}`} centered radius="md" size="md">
      <Stack gap="md">
        {step === 1 && (
          <>
            <AuditStepSources
              isCp2={isCp2}
              answeredCount={answeredCount}
              fileCount={fileCount}
              hasAnswers={hasAnswers}
              hasFiles={hasFiles}
              blocked={blocked}
              missingMandatoryCount={missingMandatoryCount}
              onGoFiles={onGoFiles ? handleGoFiles : undefined}
            />
            <Group justify="flex-end" gap="xs">
              <Button variant="quiet" onClick={handleClose} disabled={isLoading}>Hủy</Button>
              <Button disabled={blocked} onClick={() => setStep(2)}>Tiếp tục</Button>
            </Group>
          </>
        )}

        {step === 2 && (
          <>
            <AuditStepOptions
              isCp2={isCp2}
              scope={scope}
              source={source}
              submissionType={submissionType}
              hasFiles={hasFiles}
              canResubmit={hasResult}
              sourceReady={sourceReady}
              changeSummary={changeSummary}
              userNote={userNote}
              creditsRemaining={creditsRemaining}
              onSourceChange={setSourceOverride}
              onScopeChange={handleScopeChange}
              onKindChange={setSubmissionTypeOverride}
              onChangeSummary={setChangeSummary}
              onUserNote={setUserNote}
            />
            <Group justify="space-between" gap="xs">
              <Button variant="quiet" onClick={() => setStep(1)} disabled={isLoading}>Quay lại</Button>
              <Group gap="xs">
                <Button variant="quiet" onClick={handleClose} disabled={isLoading}>Hủy</Button>
                <Button loading={isLoading} disabled={!canConfirm} onClick={handleConfirm}>
                  Bắt đầu chấm bài
                </Button>
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
