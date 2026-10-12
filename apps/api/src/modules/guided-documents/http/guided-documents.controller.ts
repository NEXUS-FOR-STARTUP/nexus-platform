import type { Context } from 'hono';
import {
  readJsonBody,
  handleError,
} from '../../../shared/infrastructure/http-helpers.js';
import { requireCaseAccess } from '../../../shared/infrastructure/authorization.js';
import { getAnswersUseCase } from '../application/get-answers.usecase.js';
import { saveAnswersUseCase } from '../application/save-answers.usecase.js';
import { importProposalUseCase } from '../application/import-proposal.usecase.js';
import { generateDocxUseCase } from '../application/generate-docx.usecase.js';
import { getSyncProposalsUseCase } from '../application/get-sync-proposals.usecase.js';
import { BatchUpsertProjectAnswersInputSchema, isTemplateKey } from '@repo/validation';

export async function getAnswersHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await getAnswersUseCase(caseId);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function saveAnswersHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const rawBody = await readJsonBody(c);
    const parsed = BatchUpsertProjectAnswersInputSchema.parse(rawBody);
    const result = await saveAnswersUseCase(caseId, parsed.answers);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function importProposalHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json(
        { code: 'INVALID_FILE', message: 'Vui lòng đính kèm tệp hợp lệ (.docx, .pdf, .md)' },
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await importProposalUseCase(buffer, file.name);

    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function generateDocxHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    let body: { templateKey?: unknown } = {};
    try {
      body = (await readJsonBody(c)) as { templateKey?: unknown };
    } catch {
      body = {};
    }

    const rawKey = body?.templateKey ?? c.req.query('templateKey');
    // Missing key keeps legacy clients working; an unknown key is a client bug → 400.
    if (rawKey !== undefined && (typeof rawKey !== 'string' || !isTemplateKey(rawKey))) {
      return c.json(
        { code: 'INVALID_TEMPLATE_KEY', message: 'Biểu mẫu không hợp lệ' },
        400,
      );
    }
    const templateKey = rawKey ?? 'cp1';

    const result = await generateDocxUseCase({
      caseId,
      userId: access.session.user.id,
      templateKey,
    });

    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function getSyncProposalsHandler(c: Context) {
  const caseId = c.req.param('id') || '';
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const templateKey = c.req.query('templateKey');
    if (!isTemplateKey(templateKey)) {
      return c.json(
        { code: 'INVALID_TEMPLATE_KEY', message: 'Biểu mẫu không hợp lệ' },
        400,
      );
    }

    return c.json(await getSyncProposalsUseCase(caseId, templateKey));
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
