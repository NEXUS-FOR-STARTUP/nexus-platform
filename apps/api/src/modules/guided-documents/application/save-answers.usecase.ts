import { prisma } from '../../../db.js';
import type { UpsertProjectAnswerInput } from '@repo/validation';
import { recordCaseEvent } from '../../cases/infrastructure/persistence/case-event.repository.js';

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
