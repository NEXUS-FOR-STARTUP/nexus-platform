import { Hono } from "hono";
import { createOrderHandler, listOrdersHandler, getOrderHandler } from "./order.controller.js";

export const orderRouter = new Hono();

orderRouter.get("/", listOrdersHandler);
orderRouter.post("/", createOrderHandler);
orderRouter.get("/:id", getOrderHandler);
