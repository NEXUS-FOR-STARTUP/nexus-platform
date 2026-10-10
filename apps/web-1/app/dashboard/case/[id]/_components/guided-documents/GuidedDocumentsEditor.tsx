"use client";

import React, { useState, useMemo } from "react";
import { Button, Loader } from "@mantine/core";
// UploadCloud tạm ẩn cùng nút nhập file
import { Download, ChevronLeft } from "lucide-react";
import type { TemplateKey } from "@repo/validation";
import { useGuidedDocuments } from "../../hooks/useGuidedDocuments";
import GuidedTOC from "./GuidedTOC";
import GuidedQuestionCard from "./GuidedQuestionCard";
import GuidedImportModal from "./GuidedImportModal";

interface GuidedDocumentsEditorProps {
  caseId: string;
  templateKey: TemplateKey;
  onBack: () => void;
}

export default function GuidedDocumentsEditor({
  caseId,
  templateKey,
  onBack,
}: GuidedDocumentsEditorProps) {
  const {
    template,
    answersMap,
    isLoading,
    isSaving,
    isGenerating,
    saveAnswers,
    importFile,
    generateDocx,
    isQuestionUnlocked,
  } = useGuidedDocuments(caseId, templateKey);

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
      <div className="flex flex-col gap-2">
        <div>
          <Button
            variant="subtle"
            size="sm"
            onClick={onBack}
            leftSection={<ChevronLeft className="w-4 h-4" />}
          >
            Tất cả biểu mẫu
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-lg md:text-xl text-text-app">{template.title}</h2>
            <p className="text-xs text-text-muted">{template.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Tạm ẩn nút nhập file: bộ trích xuất hiện chỉ khớp từ khóa, gán nhầm tiêu đề mục
                làm câu trả lời. Bật lại khi có bước xử lý bằng AI.
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              leftSection={<UploadCloud className="w-4 h-4" />}
            >
              Nhập file
            </Button>
            */}

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
            questionNumber={`${currentItem.phaseIndex + 1}.${currentItem.questionIndex + 1}`}
            initialValue={answersMap[currentItem.question_id] || ""}
            onSave={handleSaveQuestion}
            isSaving={isSaving}
          />
        )}
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
