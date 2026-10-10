import { prisma } from '../../../db.js';
import { FinancePlanSchema, type FinancePlan } from '@repo/validation';

/** Returns the saved plan, or null when the team has not started one. */
export async function getFinancePlanUseCase(caseId: string): Promise<FinancePlan | null> {
  const row = await prisma.financePlan.findUnique({
    where: { case_id: caseId },
    select: { data: true },
  });
  return row ? FinancePlanSchema.parse(row.data) : null;
}

export async function saveFinancePlanUseCase(caseId: string, plan: FinancePlan): Promise<void> {
  await prisma.financePlan.upsert({
    where: { case_id: caseId },
    update: { data: plan },
    create: { case_id: caseId, data: plan },
  });
}
