import type { Context } from "hono";
import {
  requireCaseAccess,
  requireReportCaseAccess,
} from "../../../shared/infrastructure/authorization.js";
import {
  handleError,
  readJsonBody,
} from "../../../shared/infrastructure/http-helpers.js";
import { getDraftReportUseCase } from "../application/get-draft-report.usecase.js";
import { editReportUseCase } from "../application/edit-report.usecase.js";
import { approveReportUseCase } from "../application/approve-report.usecase.js";
import { getLatestReportUseCase } from "../application/get-latest-report.usecase.js";

export async function getDraftReportHandler(c: Context) {
  const caseId = c.req.param("caseId") || "";
  const access = await requireCaseAccess(c, caseId, {
    allowStudent: false,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await getDraftReportUseCase(caseId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function editReportHandler(c: Context) {
  const reportId = c.req.param("id") || "";
  const access = await requireReportCaseAccess(c, reportId, {
    allowStudent: false,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const body = (await readJsonBody(c)) as { contentMd?: string };
    const contentMd = body?.contentMd || "";
    const result = await editReportUseCase(
      reportId,
      access.caseRecord.id,
      contentMd,
    );
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function approveReportHandler(c: Context) {
  const reportId = c.req.param("id") || "";
  const access = await requireReportCaseAccess(c, reportId, {
    allowStudent: false,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await approveReportUseCase(access.session.user.id, reportId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function getLatestReportHandler(c: Context) {
  const caseId = c.req.param("caseId") || "";
  const access = await requireCaseAccess(c, caseId, {
    allowStudent: true,
    allowSupporter: true,
    allowAdmin: true,
  });

  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await getLatestReportUseCase(caseId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}
