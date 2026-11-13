"use client";

import { Stack, Textarea } from "@mantine/core";
import { StepShell } from "../StepShell";
import { MadLibsForm } from "../idea/MadLibsForm";
import { InfoTip } from "../InfoTip";
import { IDEA_DRAFT_LEAD, MAD_LIBS_LEAD, WHY } from "../../_data/copy";
import { TEXT_LIMITS } from "@repo/validation";
import type { StartForm } from "../../_hooks/usePreCp1Form";

interface FormStepProps {
  form: StartForm;
  patch: (next: Partial<StartForm>) => void;
  error: string;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}

export function FormStep({ form, patch, error, onBack, onNext, busy }: FormStepProps) {
  const structured = form.ideaMode === "structured";
  return (
    <StepShell
      title={structured ? "Kể ý tưởng trong sáu câu" : "Kể ý tưởng trong vài dòng"}
      why={WHY.form}
      lead={structured ? MAD_LIBS_LEAD : IDEA_DRAFT_LEAD}
      error={error}
      onBack={onBack}
      onNext={onNext}
      busy={busy}
      nextLabel="Tiếp"
    >
      <Stack gap="lg">
        {structured ? (
          <MadLibsForm values={form.madlibs} onChange={(id, value) => patch({ madlibs: { ...form.madlibs, [id]: value } })} />
        ) : (
          <>
            <Textarea
              autosize
              minRows={3}
              maxLength={TEXT_LIMITS.idea}
              label={
                <span className="flex items-center gap-1.5">
                  Chuyện gì đang làm bạn hoặc người quanh bạn khó chịu?
                  <InfoTip
                    title="Chuyện gì đang làm bạn khó chịu?"
                    label="Không cần là ý tưởng kinh doanh. Càng cụ thể càng tốt."
                  />
                </span>
              }
              placeholder="Ví dụ: Mỗi lần họp nhóm, cả nhóm phải nhắn tin hỏi lại ai làm phần nào."
              value={form.pain}
              onChange={(e) => patch({ pain: e.currentTarget.value })}
            />
            <Textarea
              autosize
              minRows={3}
              maxLength={TEXT_LIMITS.idea}
              label="Bạn định làm gì để đỡ chuyện đó? (không bắt buộc)"
              placeholder="Ví dụ: một bảng chung ghi việc và hạn, ai xong thì tick."
              value={form.idea}
              onChange={(e) => patch({ idea: e.currentTarget.value })}
            />
          </>
        )}
      </Stack>
    </StepShell>
  );
}
