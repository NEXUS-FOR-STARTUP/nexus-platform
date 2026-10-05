import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import {
  CATALOG_VERSION,
  TEMPLATES,
  type AnswerAction,
  classifyQuestionState,
  computeDownstreamQuestionIds,
  computeTemplateProgress,
  findTemplateForQuestion,
  getQuestion,
  getTemplate,
  isPhaseLocked,
  resolveAnswerTransition,
} from "../domain/authoring-domain.js";
import { loadAnswerRows, toAnswerStateMap } from "./authoring-persistence.js";

// ---------------------------------------------------------------------------
// Q&A CRUD (plan §6, clause 1–7). Assumes `requireCaseAccess` already passed.
// ---------------------------------------------------------------------------

export async function listTemplates(caseId: string) {
  const rows = await loadAnswerRows(caseId);
  const answers = toAnswerStateMap(rows);
  return TEMPLATES.map((t) => ({
    template_key: t.template_key,
    title: t.title,
    phase_count: t.phases.length,
    progress: computeTemplateProgress(t, answers),
  }));
}

export async function getTemplateQuestions(caseId: string, templateKey: string) {
  const template = getTemplate(templateKey);
  if (!template) {
    throw new AppError(404, "TEMPLATE_NOT_FOUND", "Không tìm thấy template");
  }
  const rows = await loadAnswerRows(caseId);
  const answers = toAnswerStateMap(rows);
  return {
    template_key: template.template_key,
    title: template.title,
    phases: template.phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      unlock_requires: phase.unlock_requires,
      unlocked: !isPhaseLocked(phase, answers),
      questions: phase.questions.map(({ question_id, classification }) => {
        const question = getQuestion(question_id)!;
        return {
          question_id,
          classification,
          text: question.text,
          state: classifyQuestionState(template, question_id, answers),
        };
      }),
    })),
  };
}

export async function getQuestionDetail(caseId: string, questionId: string) {
  const question = getQuestion(questionId);
  if (!question) {
    throw new AppError(404, "QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi");
  }
  const [answer, revisions] = await Promise.all([
    prisma.projectAnswer.findFirst({ where: { case_id: caseId, question_id: questionId } }),
    prisma.answerRevision.findMany({
      where: { case_id: caseId, question_id: questionId },
      orderBy: { revision_no: "desc" },
    }),
  ]);
  return { ...question, answer, revisions };
}

export async function saveAnswer(
  caseId: string,
  questionId: string,
  action: AnswerAction,
  text: string,
  userId: string,
) {
  const question = getQuestion(questionId);
  if (!question) {
    throw new AppError(404, "QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi");
  }
  const template = findTemplateForQuestion(questionId);
  if (!template) {
    throw new AppError(404, "QUESTION_NOT_FOUND", "Câu hỏi không thuộc template nào");
  }
  const textValue = typeof text === "string" ? text : "";
  if (action === "complete" && textValue.trim().length === 0) {
    throw new AppError(400, "INVALID_INPUT", "Vui lòng nhập nội dung trước khi hoàn thành");
  }

  return await prisma.$transaction(async (tx) => {
    const current = await tx.projectAnswer.findFirst({
      where: { case_id: caseId, question_id: questionId },
    });
    const transition = resolveAnswerTransition(
      action,
      current ? (current.status === "complete" ? "complete" : "draft") : undefined,
    );

    const latest = await tx.answerRevision.findFirst({
      where: { case_id: caseId, question_id: questionId },
      orderBy: { revision_no: "desc" },
      select: { revision_no: true },
    });
    const revisionNo = (latest?.revision_no ?? 0) + 1;

    await tx.answerRevision.create({
      data: {
        case_id: caseId,
        question_id: questionId,
        revision_no: revisionNo,
        answer_text: textValue,
        status_after: transition.status,
        source: "manual",
        source_document_record_id: null,
        catalog_version: CATALOG_VERSION,
        created_by: userId,
      },
    });

    if (current) {
      await tx.projectAnswer.update({
        where: { id: current.id },
        data: {
          status: transition.status,
          answer_text: textValue,
          needs_review: false,
          review_reason: null,
          catalog_version: CATALOG_VERSION,
        },
      });
    } else {
      await tx.projectAnswer.create({
        data: {
          case_id: caseId,
          question_id: questionId,
          status: transition.status,
          answer_text: textValue,
          needs_review: false,
          review_reason: null,
          catalog_version: CATALOG_VERSION,
        },
      });
    }

    // Clause 7 — editing a completed answer flags downstream completed answers
    // as needs_review (review_reason = which dependency changed).
    const wasComplete = current?.status === "complete";
    if (wasComplete) {
      const staleIds = computeDownstreamQuestionIds(template, questionId);
      for (const staleId of staleIds) {
        await tx.projectAnswer.updateMany({
          where: { case_id: caseId, question_id: staleId, status: "complete" },
          data: { needs_review: true, review_reason: questionId },
        });
      }
    }

    return {
      question_id: questionId,
      status: transition.status,
      transition: transition.transition,
      revision_no: revisionNo,
    };
  });
}
