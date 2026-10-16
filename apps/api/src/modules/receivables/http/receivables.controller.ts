import type { Context } from "hono";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { auth } from "../../../auth.js";
import { findSystemAccount } from "../infrastructure/system-account.js";
import { createReceivableUseCase } from "../application/create-receivable.usecase.js";
import { listReceivablesUseCase } from "../application/list-receivables.usecase.js";
import { recordManualPaymentUseCase } from "../application/record-receivable-payment.usecase.js";
import { writeOffReceivableUseCase } from "../application/write-off-receivable.usecase.js";
import { createPaymentLinkUseCase, getPublicReceivableUseCase } from "../application/public-receivable.usecase.js";
import { checkPublicReceivableRateLimit } from "../application/public-receivable-rate-limit.js";

interface Operator {
  session: typeof auth.$Infer.Session;
}

/** Only the env-configured system account runs receivables, not every admin or user. */
async function getOperatorSession(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return { ok: false as const, error: "Chưa đăng nhập", status: 401 as const };
  const account = await findSystemAccount();
  if (!account || account.id !== session.user.id) {
    return { ok: false as const, error: "Không có quyền quản lý khoản ứng nợ", status: 403 as const };
  }
  return { ok: true as const, session };
}

/** Operator guard + error mapping in one place; the handler only sees the authorised account. */
function adminHandler(run: (c: Context, op: Operator) => Promise<unknown>, status: 200 | 201 = 200) {
  return async (c: Context) => {
    const guard = await getOperatorSession(c);
    if (!guard.ok) return c.json({ code: "FORBIDDEN", message: guard.error }, guard.status);
    try {
      return c.json({ ok: true, data: await run(c, guard) }, status);
    } catch (error: unknown) {
      return handleError(c, error);
    }
  };
}

const id = (c: Context) => c.req.param("id") || "";

export const listReceivablesHandler = adminHandler((c) => listReceivablesUseCase(c.req.query()));
export const createReceivableHandler = adminHandler(
  async (c, a) => createReceivableUseCase(a.session.user.id, await readJsonBody(c)),
  201,
);
export const recordPaymentHandler = adminHandler(
  async (c, a) => recordManualPaymentUseCase(a.session.user.id, id(c), await readJsonBody(c)),
);
export const writeOffHandler = adminHandler(
  async (c, a) => writeOffReceivableUseCase(a.session.user.id, id(c), await readJsonBody(c)),
);
export const createPaymentLinkHandler = adminHandler((c) => createPaymentLinkUseCase(id(c)));
/** Tells the UI whether the signed-in user is the system account (show the debt UI) and which case list to use. */
export async function systemAccountHandler(c: Context) {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }, 401);
    const account = await findSystemAccount();
    return c.json({ ok: true, data: account?.id === session.user.id ? account : null });
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/** Public, unauthenticated. The token is a bearer secret, so nothing here may log it. */
export async function getPublicReceivableHandler(c: Context) {
  try {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "127.0.0.1";
    checkPublicReceivableRateLimit(ip);
    c.header("Cache-Control", "no-store");
    c.header("Referrer-Policy", "no-referrer");
    return c.json({ ok: true, data: await getPublicReceivableUseCase(c.req.param("token") || "") });
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
