import { prisma } from '../../../db.js';
import type { UpsertProjectAnswerInput } from '@repo/validation';

export async function saveAnswersUseCase(
  caseId: string,
  answers: UpsertProjectAnswerInput[],
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

  return { ok: true, count: answers.length };
}
