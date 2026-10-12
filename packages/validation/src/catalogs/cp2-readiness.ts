import type { QuestionId } from "./questions.js";
import type { Template } from "./types.js";

/**
 * Rubric auto-fail items the team confirms themselves. Stored as ProjectAnswer rows
 * ("true"/"false") but deliberately NOT part of any phase template, so the docx export
 * and sync rules never see them. Self-declared only: the CP2 audit is what verifies.
 */
export const CP2_SELF_CHECKS = [
  { id: "cp2_selfcheck_experts", label: "Đã phỏng vấn ít nhất 2 chuyên gia có từ 6 tháng kinh nghiệm" },
  { id: "cp2_selfcheck_survey", label: "Khảo sát có ít nhất 100 phản hồi, từ 7 câu hỏi, gồm ít nhất 2 loại câu hỏi" },
  { id: "cp2_selfcheck_ai_disclosure", label: "Đã ghi rõ phần có dùng AI trong báo cáo" },
] as const;

export type Cp2SelfCheckId = (typeof CP2_SELF_CHECKS)[number]["id"];

/** Answers needed before the interview question-bank audit can run (plus the bank itself or an attachment). */
export const CP2_INTERVIEW_AUDIT_REQUIRED: readonly QuestionId[] = [
  "cp2_research_objectives",
  "cp2_vpc_customer_profile",
  "cp2_problem_need",
];

export const CP2_QUESTION_BANK_ID: QuestionId = "cp2_question_bank";

export interface Readiness {
  requiredDone: number;
  requiredTotal: number;
  missing: QuestionId[];
  autoFail: { id: Cp2SelfCheckId; label: string; checked: boolean }[];
  /** All required questions answered and every auto-fail item confirmed. */
  ready: boolean;
  /** Enough input to run the interview question-bank audit. */
  interviewAuditReady: boolean;
  interviewAuditMissing: QuestionId[];
}

const isAnswered = (answers: Readonly<Record<string, string | undefined>>, id: string): boolean =>
  (answers[id] ?? "").trim() !== "";

/** Pure: counts only the saved answers passed in; self-checks never raise requiredDone. */
export function computeReadiness(
  template: Template,
  answers: Readonly<Record<string, string | undefined>>,
  selfChecks: Readonly<Partial<Record<Cp2SelfCheckId, boolean>>>,
  hasCp2Attachment: boolean,
): Readiness {
  const required = template.phases
    .flatMap((p) => p.questions)
    .filter((q) => q.classification === "required")
    .map((q) => q.question_id as QuestionId);
  const missing = required.filter((id) => !isAnswered(answers, id));
  const autoFail = CP2_SELF_CHECKS.map((c) => ({ id: c.id, label: c.label, checked: selfChecks[c.id] === true }));

  const interviewAuditMissing = CP2_INTERVIEW_AUDIT_REQUIRED.filter((id) => !isAnswered(answers, id));
  const hasQuestionBank = hasCp2Attachment || isAnswered(answers, CP2_QUESTION_BANK_ID);
  if (!hasQuestionBank) interviewAuditMissing.push(CP2_QUESTION_BANK_ID);

  return {
    requiredDone: required.length - missing.length,
    requiredTotal: required.length,
    missing,
    autoFail,
    ready: missing.length === 0 && autoFail.every((c) => c.checked),
    interviewAuditReady: interviewAuditMissing.length === 0,
    interviewAuditMissing,
  };
}
