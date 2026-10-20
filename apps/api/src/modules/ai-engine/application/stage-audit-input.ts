import { STAGES, type StageCode } from "@app/shared";
import { SUBMITTED_DOC_EXCLUDED_KINDS } from "../../documents/domain/document-types.js";
import { QUESTION_REGISTRY, TEMPLATE_REGISTRY } from "@repo/validation";
import { prisma } from "../../../db.js";

export const STAGE_DOC_EXCLUDED_TYPES = ["assessment_report", "supporter_output", "supporter_attachment", "payment_proof"];
const SELF_CHECK_ID_FRAGMENT = "_selfcheck_";

type AnswerMap = Readonly<Record<string, string | undefined>>;

function questionText(id: string): string {
  const entry = (QUESTION_REGISTRY as Record<string, { text: string } | undefined>)[id];
  return entry?.text ?? id;
}

/** Template keys of the given stage and every earlier stage, in journey order. */
function templateKeysUpTo(code: StageCode): Array<keyof typeof TEMPLATE_REGISTRY> {
  const index = STAGES.findIndex((s) => s.code === code);
  return STAGES.slice(0, index + 1).map((s) => s.templateKey);
}

/**
 * Answers of the stage and earlier stages, template order, empty answers and
 * self-checks skipped. Text is copied verbatim so quotes stay substring-checkable.
 */
export function renderStageAnswers(code: StageCode, answers: AnswerMap): { markdown: string; answered: number } {
  const sections: string[] = [];
  for (const key of templateKeysUpTo(code)) {
    for (const phase of TEMPLATE_REGISTRY[key].phases) {
      for (const question of phase.questions) {
        const answer = answers[question.question_id];
        if (answer === undefined || answer.trim() === "" || question.question_id.includes(SELF_CHECK_ID_FRAGMENT)) continue;
        sections.push(`## [${question.question_id}] ${questionText(question.question_id)}\n\n${answer}`);
      }
    }
  }
  return { markdown: `# Tài liệu của nhóm\n\n${sections.join("\n\n")}\n`, answered: sections.length };
}

/** Non-empty answers of this stage's own template, plus files filed under this stage. */
export async function countStageInputs(caseId: string, code: StageCode): Promise<{ answers: number; files: number }> {
  const stage = STAGES.find((s) => s.code === code);
  if (!stage) return { answers: 0, files: 0 };
  const own = new Set(TEMPLATE_REGISTRY[stage.templateKey].phases.flatMap((p) => p.questions.map((q) => q.question_id)));
  const [rows, checkpoint] = await Promise.all([
    prisma.projectAnswer.findMany({ where: { case_id: caseId }, select: { question_id: true, answer_text: true } }),
    prisma.checkpoint.findUnique({ where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: code } }, select: { id: true } }),
  ]);
  const answers = rows.filter((r) => own.has(r.question_id) && r.answer_text.trim() !== "").length;
  const files = checkpoint
    ? await prisma.documentRecord.count({
        where: { case_id: caseId, checkpoint_id: checkpoint.id, superseded_at: null, source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] }, doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES } },
      })
    : 0;
  return { answers, files };
}

/** Live, student-submitted files filed under a stage, oldest first (the set `countStageInputs` counts). */
export async function findStageDocs(caseId: string, code: StageCode) {
  const checkpoint = await prisma.checkpoint.findUnique({ where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: code } }, select: { id: true } });
  if (!checkpoint) return [];
  return await prisma.documentRecord.findMany({
    where: { case_id: caseId, checkpoint_id: checkpoint.id, superseded_at: null, source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] }, doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES } },
    orderBy: [{ created_at: "asc" }],
  });
}
