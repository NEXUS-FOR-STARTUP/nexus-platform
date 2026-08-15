import type { Context } from "hono";
import { getSession } from "../../../../shared/infrastructure/http-helpers.js";
import { handleError } from "../../../../shared/infrastructure/http-helpers.js";
import { createOrderUseCase } from "../../application/create-order.usecase.js";
import { listOrdersUseCase } from "../../application/list-orders.usecase.js";
import { getOrderUseCase } from "../../application/get-order.usecase.js";

export async function createOrderHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }, 401);
    const body = await c.req.json();
    const result = await createOrderUseCase(session.user.id, body);
    return c.json(result, 201);
  } catch (err) { return handleError(c, err); }
}

export async function listOrdersHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }, 401);
    const { limit = "20", offset = "0" } = c.req.query();
    const result = await listOrdersUseCase(session.user.id, Number(limit), Number(offset));
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function getOrderHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session) return c.json({ code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" }, 401);
    const { id } = c.req.param();
    const result = await getOrderUseCase(session.user.id, id);
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}
