import type { Context } from "hono";
import { getSession } from "../../../../shared/infrastructure/http-helpers.js";
import { handleError } from "../../../../shared/infrastructure/http-helpers.js";
import { createDepositUseCase } from "../../application/create-deposit.usecase.js";
import { verifyDepositUseCase } from "../../application/verify-deposit.usecase.js";
import { listDepositsUseCase } from "../../application/list-deposits.usecase.js";
import { getDepositUseCase } from "../../application/get-deposit.usecase.js";
import { listAllDepositsUseCase } from "../../application/list-all-deposits.usecase.js";
import type { CreateDepositRequest } from "../../domain/deposit.types.js";

export async function createDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }, 401);
    const { amount, idempotency_key } = await c.req.json<CreateDepositRequest>();
    const result = await createDepositUseCase(session.user.id, amount, idempotency_key);
    return c.json(result, 201);
  } catch (err) { return handleError(c, err); }
}

export async function listDepositsHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }, 401);
    const { limit = "20", offset = "0" } = c.req.query();
    const result = await listDepositsUseCase(session.user.id, Number(limit), Number(offset));
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function getDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }, 401);
    const { id } = c.req.param();
    const result = await getDepositUseCase(session.user.id, id);
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function verifyDepositHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session || session.user.role !== "admin") {
      return c.json({ code: "FORBIDDEN", message: "Chỉ admin mới có quyền xác thực" }, 403);
    }
    const { id } = c.req.param();
    const { status, rejectionReason } = await c.req.json<{
      status: "verified" | "rejected";
      rejectionReason?: string;
    }>();
    const result = await verifyDepositUseCase(session.user.id, id, status, rejectionReason);
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function listAllDepositsHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session || session.user.role !== "admin") {
      return c.json({ code: "FORBIDDEN", message: "Chỉ admin mới có quyền truy cập" }, 403);
    }
    const { status, limit = "50", offset = "0" } = c.req.query();
    const result = await listAllDepositsUseCase(session.user.id, {
      status,
      limit: Number(limit),
      offset: Number(offset),
    });
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}
