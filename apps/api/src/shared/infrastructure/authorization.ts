import { prisma } from "../../db.js";
import { auth } from "../../auth.js";
import logger from "./logger.js";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

type CaseAccessScope = {
  allowStudent?: boolean;
  allowSupporter?: boolean;
  allowAdmin?: boolean;
};

type CaseAccessRecord = {
  id: string;
  owner_auth_user_id: string;
  assigned_supporter_auth_user_id: string | null;
  user_facing_stage?: string;
  internal_status?: string;
  members: Array<{ auth_user_id: string }>;
};

type ReportAccessRecord = {
  id: string;
  case_id: string;
  case: CaseAccessRecord | null;
};

const defaultScope: Required<CaseAccessScope> = {
  allowStudent: true,
  allowSupporter: true,
  allowAdmin: true,
};

export async function getSession(c: any): Promise<Session> {
  try {
    return await auth.api.getSession({ headers: c.req.raw.headers });
  } catch (error) {
    logger.error({ err: error }, 'authorization getSession failed');
    return null;
  }
}

function hasCaseAccess(
  session: NonNullable<Session>,
  caseRecord: CaseAccessRecord,
  scope: Required<CaseAccessScope>,
) {
  const userId = session.user.id;
  const role = (session.user as any).role;

  if (scope.allowAdmin && role === "admin") {
    return true;
  }

  if (scope.allowSupporter && role === "supporter" && caseRecord.assigned_supporter_auth_user_id === userId) {
    return true;
  }

  if (scope.allowStudent) {
    if (caseRecord.owner_auth_user_id === userId) {
      return true;
    }

    if (caseRecord.members.some((member) => member.auth_user_id === userId)) {
      return true;
    }
  }

  return false;
}

export async function requireCaseAccess(
  c: any,
  caseId: string,
  scope: CaseAccessScope = defaultScope,
) {
  try {
    const session = await getSession(c);
    if (!session) {
      return { ok: false as const, response: c.json({ error: "Chưa đăng nhập" }, 401) };
    }

    const caseRecord = (await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        owner_auth_user_id: true,
        assigned_supporter_auth_user_id: true,
        user_facing_stage: true,
        internal_status: true,
        members: {
          select: {
            auth_user_id: true,
          },
        },
      },
    })) as CaseAccessRecord | null;

    if (!caseRecord) {
      logger.warn({ caseId, reason: 'not_found' }, 'requireCaseAccess: case not found')
      return { ok: false as const, response: c.json({ error: "Không tìm thấy dự án" }, 404) };
    }

    const mergedScope = { ...defaultScope, ...scope };
    if (!hasCaseAccess(session, caseRecord, mergedScope)) {
      logger.warn({ caseId, userId: session.user.id, role: (session.user as any).role, reason: 'access_denied' }, 'requireCaseAccess: access denied')
      return { ok: false as const, response: c.json({ error: "Không có quyền truy cập dự án này" }, 403) };
    }

    return { ok: true as const, session, caseRecord };
  } catch (error: any) {
    logger.error({ err: error, caseId }, 'requireCaseAccess failed');
    return { ok: false as const, response: c.json({ error: "Lỗi hệ thống khi xác thực quyền truy cập dự án" }, 500) };
  }
}

export async function requireReportCaseAccess(
  c: any,
  reportId: string,
  scope: CaseAccessScope = defaultScope,
) {
  try {
    const session = await getSession(c);
    if (!session) {
      return { ok: false as const, response: c.json({ error: "Chưa đăng nhập" }, 401) };
    }

    const report = (await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        case_id: true,
        case: {
          select: {
            id: true,
            owner_auth_user_id: true,
            assigned_supporter_auth_user_id: true,
            user_facing_stage: true,
            internal_status: true,
            members: {
              select: {
                auth_user_id: true,
              },
            },
          },
        },
      },
    })) as ReportAccessRecord | null;

    if (!report) {
      logger.warn({ reportId, reason: 'not_found' }, 'requireReportCaseAccess: report not found')
      return { ok: false as const, response: c.json({ error: "Không tìm thấy báo cáo" }, 404) };
    }

    const caseRecord = report.case;
    if (!caseRecord) {
      logger.warn({ reportId, caseId: report.case_id, reason: 'case_not_found' }, 'requireReportCaseAccess: case not found for report')
      return { ok: false as const, response: c.json({ error: "Không tìm thấy dự án liên quan đến báo cáo" }, 404) };
    }

    const mergedScope = { ...defaultScope, ...scope };
    if (!hasCaseAccess(session, caseRecord, mergedScope)) {
      logger.warn({ reportId, caseId: caseRecord.id, userId: session.user.id, role: (session.user as any).role, reason: 'access_denied' }, 'requireReportCaseAccess: access denied')
      return { ok: false as const, response: c.json({ error: "Không có quyền truy cập báo cáo này" }, 403) };
    }

    return { ok: true as const, session, report, caseRecord };
  } catch (error: any) {
    logger.error({ err: error, reportId }, 'requireReportCaseAccess failed');
    return { ok: false as const, response: c.json({ error: "Lỗi hệ thống khi xác thực quyền truy cập báo cáo" }, 500) };
  }
}
