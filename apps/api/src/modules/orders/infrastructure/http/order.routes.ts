import { Hono } from "hono";
import { createOrderHandler, listOrdersHandler, getOrderHandler, checkDiscountCodeHandler } from "./order.controller.js";

export const orderRouter = new Hono();

orderRouter.get("/", listOrdersHandler);
orderRouter.post("/", createOrderHandler);
orderRouter.post("/discount-check", checkDiscountCodeHandler);
orderRouter.get("/:id", getOrderHandler);
