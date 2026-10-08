import { prisma } from '../../../db.js';

export async function getAnswersUseCase(caseId: string) {
  const answers = await prisma.projectAnswer.findMany({
    where: { case_id: caseId },
    select: {
      id: true,
      case_id: true,
      question_id: true,
      answer_text: true,
      updated_at: true,
    },
    orderBy: { updated_at: 'asc' },
  });

  return {
    items: answers,
    total: answers.length,
  };
}
