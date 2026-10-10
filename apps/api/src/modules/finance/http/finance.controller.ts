import type { Context } from 'hono';
import { readJsonBody, handleError } from '../../../shared/infrastructure/http-helpers.js';
import { requireCaseAccess } from '../../../shared/infrastructure/authorization.js';
import { FinancePlanSchema } from '@repo/validation';
import {
  getFinancePlanUseCase,
  saveFinancePlanUseCase,
} from '../application/finance-plan.usecase.js';

export async function getFinancePlanHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    return c.json({ plan: await getFinancePlanUseCase(caseId) });
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function saveFinancePlanHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const plan = FinancePlanSchema.parse(await readJsonBody(c));
    await saveFinancePlanUseCase(caseId, plan);
    return c.json({ ok: true });
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
