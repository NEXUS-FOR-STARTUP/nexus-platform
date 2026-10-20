"use client";

import { useRef, useState } from "react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { QUESTION_REGISTRY, type Question, type TemplateKey } from "@repo/validation";
import { useGuidedDocuments } from "../../hooks/useGuidedDocuments";
import type { useGuidedDrafts } from "../../hooks/useGuidedDrafts";
import { GUIDED_MOBILE_QUERY, useGuidedNavigation } from "../../hooks/useGuidedNavigation";
import Cp2SelfCheck, { CP2_SELF_CHECK_BY_QUESTION } from "./Cp2SelfCheck";
import GuidedImportModal from "./GuidedImportModal";
import GuidedLeaveModal from "./GuidedLeaveModal";
import StageActionsMenu from "../workspace/stage/StageActionsMenu";
import { Button } from "../ui/Button";
import GuidedTOC from "./GuidedTOC";
import GuidedQuestionCard from "./GuidedQuestionCard";
import GuidedHintPanel from "./GuidedHintPanel";
import s from "./guided-editor.module.css";
import GuidedEditorSkeleton from "./GuidedEditorSkeleton";

interface GuidedDocumentsEditorProps {
  caseId: string;
  templateKey: TemplateKey;
  /** Drafts live in the parent so the stage header menu sees the same unsaved answers. */
  draftsApi: ReturnType<typeof useGuidedDrafts>;
  onBack: () => void;
  hideBackButton?: boolean;
}

export default function GuidedDocumentsEditor({
  caseId,
  templateKey,
  draftsApi,
  onBack,
  hideBackButton = false,
}: GuidedDocumentsEditorProps) {
  const {
    template,
    answersMap,
    isLoading,
    isSaving,
    saveAnswers,
    importFile,
    isQuestionUnlocked,
  } = useGuidedDocuments(caseId, templateKey);

  const { flat, current, prev, next, select } = useGuidedNavigation(template, isQuestionUnlocked);
  const isMobile = useMediaQuery(GUIDED_MOBILE_QUERY);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [confirmBackOpen, { open: openConfirmBack, close: closeConfirmBack }] = useDisclosure(false);
  const { drafts, setDraft, clearDraft, clearDrafts } = draftsApi;

  const templateDraftIds = flat.map((q) => q.question_id).filter((id) => id in drafts);

  const goTo = (questionId: string) => {
    select(questionId);
    // Folding the list on phones would drop focus, so move it to the new question.
    if (isMobile) requestAnimationFrame(() => headingRef.current?.focus());
  };

  const handleBack = () => {
    if (isSaving) return;
    if (templateDraftIds.length > 0) openConfirmBack();
    else onBack();
  };

  const handleSaveBack = async () => {
    await saveAnswers(templateDraftIds.map((question_id) => ({ question_id, answer_text: drafts[question_id] })));
    clearDrafts(templateDraftIds);
    closeConfirmBack();
    onBack();
  };

  const handleDiscardBack = () => {
    clearDrafts(templateDraftIds);
    closeConfirmBack();
    onBack();
  };

  const handleChange = (qId: string, text: string) => {
    if (text === (answersMap[qId] ?? "")) clearDraft(qId);
    else setDraft(qId, text);
  };

  const handleSaveQuestion = async (qId: string, answerText: string) => {
    await saveAnswers([{ question_id: qId, answer_text: answerText }]);
    clearDraft(qId);
  };

  const handleApplyProposals = async (
    answers: Array<{ question_id: string; answer_text: string }>
  ) => {
    await saveAnswers(answers);
  };

  if (isLoading) return <GuidedEditorSkeleton />;

  const currentId = current?.question_id ?? "";

  return (
    <div className="flex flex-col gap-4 w-full">
      <GuidedLeaveModal
        opened={confirmBackOpen}
        isSaving={isSaving}
        onClose={closeConfirmBack}
        onDiscard={handleDiscardBack}
        onSaveAndLeave={handleSaveBack}
      />
      {!hideBackButton && (
        <div className="flex flex-col gap-2">
          <div>
            <Button variant="ghost" onClick={handleBack} leftSection={<CaretLeftIcon size={16} aria-hidden />}>
              Tất cả biểu mẫu
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-lg md:text-xl text-text-app">{template.title}</h2>
              <p className="text-xs text-text-muted">{template.description}</p>
            </div>
            <StageActionsMenu caseId={caseId} templateKey={templateKey} draftQuestionIds={Object.keys(drafts)} />
          </div>
        </div>
      )}

      <div className={s.layout}>
        <div className={s.toc}>
          <GuidedTOC
            template={template}
            answersMap={answersMap}
            activeQuestionId={currentId}
            onSelectQuestion={goTo}
            isQuestionUnlocked={isQuestionUnlocked}
            criticalQuestionIds={templateKey === "cp2" ? Object.keys(CP2_SELF_CHECK_BY_QUESTION) : undefined}
          />
        </div>

        {current && (
          <div className={s.card}>
            <GuidedQuestionCard
              key={currentId}
              questionId={currentId}
              questionPosition={flat.findIndex((q) => q.question_id === currentId) + 1}
              questionTotal={flat.length}
              classification={current.classification}
              value={drafts[currentId] ?? answersMap[currentId] ?? ""}
              isDirty={currentId in drafts}
              onChange={(text) => handleChange(currentId, text)}
              onSave={handleSaveQuestion}
              isSaving={isSaving}
              headingRef={headingRef}
              onPrev={prev && (() => goTo(prev.question_id))}
              onNext={next && (() => goTo(next.question_id))}
            >
              {templateKey === "cp2" && (
                <Cp2SelfCheck
                  questionId={currentId}
                  answersMap={answersMap}
                  isSaving={isSaving}
                  onSaveAnswers={saveAnswers}
                />
              )}
            </GuidedQuestionCard>
          </div>
        )}

        <div className={s.hint}>
          <GuidedHintPanel
            key={currentId}
            question={(QUESTION_REGISTRY as Record<string, Question | undefined>)[currentId]}
          />
        </div>
      </div>

      <GuidedImportModal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importFile}
        onApplyProposals={handleApplyProposals}
      />
    </div>
  );
}
