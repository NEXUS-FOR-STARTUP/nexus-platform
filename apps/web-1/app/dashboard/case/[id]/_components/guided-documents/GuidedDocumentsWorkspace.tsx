"use client";

import React, { useState, useMemo } from "react";
import { SegmentedControl, Button, Loader } from "@mantine/core";
import { Download, UploadCloud, FileEdit, CheckCircle } from "lucide-react";
import { useGuidedDocuments } from "../../hooks/useGuidedDocuments";
import GuidedTOC from "./GuidedTOC";
import GuidedQuestionCard from "./GuidedQuestionCard";
import GuidedImportModal from "./GuidedImportModal";

interface GuidedDocumentsWorkspaceProps {
  caseId: string;
}

export default function GuidedDocumentsWorkspace({
  caseId,
}: GuidedDocumentsWorkspaceProps) {
  const {
    templateKey,
    setTemplateKey,
    template,
    answersMap,
    isLoading,
    isSaving,
    isGenerating,
    saveAnswers,
    importFile,
    generateDocx,
    isQuestionUnlocked,
  } = useGuidedDocuments(caseId);

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    template.phases[0]?.questions[0]?.question_id || ""
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Flat list of all questions in current template
  const flatQuestions = useMemo(() => {
    const list: Array<{
      question_id: string;
      phaseIndex: number;
      questionIndex: number;
    }> = [];
    template.phases.forEach((p, pIdx) => {
      p.questions.forEach((q, qIdx) => {
        list.push({
          question_id: q.question_id,
          phaseIndex: pIdx,
          questionIndex: qIdx,
        });
      });
    });
    return list;
  }, [template]);

  const currentIndex = flatQuestions.findIndex(
    (q) => q.question_id === activeQuestionId
  );
  const currentItem = flatQuestions[currentIndex] || flatQuestions[0];

  const handleSaveQuestion = async (qId: string, answerText: string) => {
    await saveAnswers([{ question_id: qId, answer_text: answerText }]);
  };

  const handleApplyProposals = async (
    answers: Array<{ question_id: string; answer_text: string }>
  ) => {
    await saveAnswers(answers);
  };

  const hasPrev = currentIndex > 0;
  const hasNext =
    currentIndex >= 0 &&
    currentIndex < flatQuestions.length - 1 &&
    isQuestionUnlocked(
      flatQuestions[currentIndex + 1].phaseIndex,
      flatQuestions[currentIndex + 1].questionIndex
    );

  const handleNavigatePrev = () => {
    if (hasPrev) {
      setActiveQuestionId(flatQuestions[currentIndex - 1].question_id);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      setActiveQuestionId(flatQuestions[currentIndex + 1].question_id);
    }
  };

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
      {/* Top Header / Toolbar */}
      <div className="bg-surface-app border border-border-app rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-base md:text-lg text-text-app">
              Soạn thảo tài liệu có hướng dẫn
            </h2>
          </div>
          <p className="text-xs text-text-muted">
            Trả lời từng câu hỏi theo phương pháp 1-way forward để hệ thống tự động sinh báo cáo chuẩn DOCX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SegmentedControl
            value={templateKey}
            onChange={(val) => {
              setTemplateKey(val as "cp1" | "cp2");
              setActiveQuestionId("");
            }}
            data={[
              { label: "CP1 (Ý tưởng)", value: "cp1" },
              { label: "CP2 (Xác thực)", value: "cp2" },
            ]}
            size="sm"
          />

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftSection={<UploadCloud className="w-4 h-4" />}
          >
            Nhập file
          </Button>

          <Button
            variant="filled"
            color="blue"
            size="sm"
            loading={isGenerating}
            onClick={() => generateDocx()}
            leftSection={<Download className="w-4 h-4" />}
          >
            Xuất file DOCX
          </Button>
        </div>
      </div>

      {/* Main Content: TOC on Left, Question Editor on Right */}
      <div className="flex flex-col md:flex-row items-start gap-5 w-full">
        <GuidedTOC
          template={template}
          answersMap={answersMap}
          activeQuestionId={activeQuestionId || currentItem?.question_id || ""}
          onSelectQuestion={(qId) => setActiveQuestionId(qId)}
          isQuestionUnlocked={isQuestionUnlocked}
        />

        {currentItem && (
          <GuidedQuestionCard
            key={currentItem.question_id}
            questionId={currentItem.question_id}
            initialValue={answersMap[currentItem.question_id] || ""}
            onSave={handleSaveQuestion}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Import Modal */}
      <GuidedImportModal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importFile}
        onApplyProposals={handleApplyProposals}
      />
    </div>
  );
}
