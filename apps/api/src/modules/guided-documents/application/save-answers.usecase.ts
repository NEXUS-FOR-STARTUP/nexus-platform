import { prisma } from '../../../db.js';
import { QUESTION_REGISTRY, checkChoiceAnswer, type Question, type UpsertProjectAnswerInput } from '@repo/validation';
import { AppError } from '../../../shared/domain/app-error.js';
import { recordCaseEvent } from '../../cases/infrastructure/persistence/case-event.repository.js';

/** Single-choice answers must be valid before anything is stored; "" clears an optional answer. */
function assertChoiceAnswersValid(answers: UpsertProjectAnswerInput[]): void {
  for (const item of answers) {
    const question = (QUESTION_REGISTRY as Record<string, Question | undefined>)[item.question_id];
    if (!question?.options || item.answer_text === '') continue;
    const check = checkChoiceAnswer(item.answer_text, question);
    if (!check.ok) throw new AppError(400, 'INVALID_CHOICE_ANSWER', check.reason, { question_id: item.question_id });
  }
}

/** Answers autosave while typing; one timeline entry per window keeps the history readable. */
const ANSWERS_EVENT_WINDOW_MS = 30 * 60 * 1000;

export async function saveAnswersUseCase(
  caseId: string,
  answers: UpsertProjectAnswerInput[],
  actorUserId: string,
) {
  if (!answers || answers.length === 0) {
    return { ok: true, count: 0 };
  }
  assertChoiceAnswersValid(answers);

  await prisma.$transaction(
    answers.map((item) =>
      prisma.projectAnswer.upsert({
        where: {
          case_id_question_id: {
            case_id: caseId,
            question_id: item.question_id,
          },
        },
        update: {
          answer_text: item.answer_text,
        },
        create: {
          case_id: caseId,
          question_id: item.question_id,
          answer_text: item.answer_text,
        },
      })
    )
  );

  const recent = await prisma.caseEvent.findFirst({
    where: {
      case_id: caseId,
      event_type: 'answers_saved',
      created_at: { gte: new Date(Date.now() - ANSWERS_EVENT_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (!recent) {
    await recordCaseEvent(prisma, { caseId, eventType: 'answers_saved', actorUserId, metadata: { count: answers.length } });
  }

  return { ok: true, count: answers.length };
}
