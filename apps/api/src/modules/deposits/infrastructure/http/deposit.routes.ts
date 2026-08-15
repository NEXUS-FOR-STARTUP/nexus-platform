import { Hono } from "hono";
import {
  createDepositHandler,
  listDepositsHandler,
  getDepositHandler,
  verifyDepositHandler,
  listAllDepositsHandler,
} from "./deposit.controller.js";

export const depositRouter = new Hono();

depositRouter.get("/admin/all", listAllDepositsHandler);
depositRouter.get("/", listDepositsHandler);
depositRouter.post("/", createDepositHandler);
depositRouter.get("/:id", getDepositHandler);
depositRouter.post("/:id/verify", verifyDepositHandler);
