"use client";

import { Checkbox, List, Progress } from "@mantine/core";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { QUESTION_REGISTRY, type Template } from "@repo/validation";
import { useCp2Readiness } from "../../hooks/useCp2Readiness";

interface Cp2ReadinessPanelProps {
  caseId: string;
  template: Template;
  answersMap: Record<string, string>;
  isSaving: boolean;
  onSaveAnswers: (answers: Array<{ question_id: string; answer_text: string }>) => Promise<unknown>;
  onSelectQuestion: (questionId: string) => void;
}

export default function Cp2ReadinessPanel({
  caseId,
  template,
  answersMap,
  isSaving,
  onSaveAnswers,
  onSelectQuestion,
}: Cp2ReadinessPanelProps) {
  const readiness = useCp2Readiness(caseId, template, answersMap);
  const percent = readiness.requiredTotal === 0 ? 0 : (readiness.requiredDone / readiness.requiredTotal) * 100;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-text-app">Mức sẵn sàng nộp</span>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          {readiness.ready ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <CircleAlert className="w-4 h-4 text-orange-500" />
          )}
          {readiness.requiredDone}/{readiness.requiredTotal} câu bắt buộc
        </span>
      </div>

      <Progress value={percent} color={readiness.ready ? "green" : "blue"} size="sm" aria-label="Tiến độ câu bắt buộc" />

      {readiness.missing.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-text-app">Câu bắt buộc còn thiếu</p>
          <List size="xs" spacing={4} listStyleType="none">
            {readiness.missing.map((id) => (
              <List.Item key={id}>
                <button
                  type="button"
                  onClick={() => onSelectQuestion(id)}
                  className="text-left text-text-muted hover:text-text-app underline cursor-pointer"
                >
                  {QUESTION_REGISTRY[id].text}
                </button>
              </List.Item>
            ))}
          </List>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-text-app">Điều kiện bắt buộc của rubric (nhóm tự xác nhận)</p>
        {readiness.autoFail.map((item) => (
          <Checkbox
            key={item.id}
            size="xs"
            label={item.label}
            checked={item.checked}
            disabled={isSaving}
            onChange={(e) => onSaveAnswers([{ question_id: item.id, answer_text: String(e.currentTarget.checked) }])}
          />
        ))}
        <p className="text-xs text-text-muted">
          Phần này do nhóm tự khai, hệ thống chưa kiểm chứng. Thiếu một mục có thể khiến báo cáo bị trượt.
        </p>
      </div>

      <p className="text-xs text-text-muted">
        Phỏng vấn thật có giá trị hơn khảo sát Google Form. Hãy ưu tiên nói chuyện trực tiếp với khách hàng và chuyên gia.
      </p>
    </div>
  );
}
