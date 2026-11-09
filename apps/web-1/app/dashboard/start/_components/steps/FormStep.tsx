"use client";

import { Stack, Text, Textarea } from "@mantine/core";
import { StepShell } from "../StepShell";
import { MadLibsForm } from "../idea/MadLibsForm";
import { IDEA_DRAFT_LEAD, MAD_LIBS_LEAD, WHY } from "../../_data/copy";
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
      error={error}
      onBack={onBack}
      onNext={onNext}
      busy={busy}
      nextLabel={structured ? "Xem kết quả" : "Tiếp"}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed" lh={1.6}>
          {structured ? MAD_LIBS_LEAD : IDEA_DRAFT_LEAD}
        </Text>
        {structured ? (
          <MadLibsForm values={form.madlibs} onChange={(id, value) => patch({ madlibs: { ...form.madlibs, [id]: value } })} />
        ) : (
          <>
            <Textarea
              autosize
              minRows={3}
              label="Chuyện gì đang làm bạn hoặc người quanh bạn khó chịu?"
              description="Không cần là ý tưởng kinh doanh. Càng cụ thể càng tốt."
              placeholder="Ví dụ: Mỗi lần họp nhóm, cả nhóm phải nhắn tin hỏi lại ai làm phần nào."
              value={form.pain}
              onChange={(e) => patch({ pain: e.currentTarget.value })}
            />
            <Textarea
              autosize
              minRows={3}
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
