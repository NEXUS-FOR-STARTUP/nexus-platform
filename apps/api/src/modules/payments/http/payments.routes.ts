import { Hono } from "hono";
// Old handler imports deprecated — routes return 410 Gone
// import {
//   listPaymentsHandler,
//   listMyPaymentsHandler,
//   createPaymentHandler,
//   getPaymentHandler,
//   uploadPaymentProofHandler,
//   verifyPaymentHandler,
// } from "./payments.controller.js";

export const paymentsRouter = new Hono();

// POST /api/payments — deprecated
paymentsRouter.post("/", (c) =>
  c.json(
    {
      error: "GONE",
      message:
        "Tạo đơn nạp tiền tại POST /api/deposits. Tạo đơn mua credit tại POST /api/orders.",
    },
    410,
  ),
);

// GET /api/payments — deprecated
paymentsRouter.get("/", (c) =>
  c.json(
    {
      error: "GONE",
      message: "Xem lịch sử giao dịch tại /api/deposits",
    },
    410,
  ),
);

// GET /api/payments/my — deprecated
paymentsRouter.get("/my", (c) =>
  c.json(
    {
      error: "GONE",
      message: "Xem lịch sử giao dịch tại /api/deposits",
    },
    410,
  ),
);

// GET /api/payments/:id — deprecated
paymentsRouter.get("/:id", (c) =>
  c.json(
    {
      error: "GONE",
      message: "Xem chi tiết giao dịch tại /api/deposits/:id",
    },
    410,
  ),
);

// POST /api/payments/proof — deprecated
paymentsRouter.post("/proof", (c) =>
  c.json(
    {
      error: "GONE",
      message: "API này đã bị loại bỏ.",
    },
    410,
  ),
);

// POST /api/payments/:id/verify — deprecated
paymentsRouter.post("/:id/verify", (c) =>
  c.json(
    {
      error: "GONE",
      message: "Xác thực giao dịch tại POST /api/deposits/:id/verify",
    },
    410,
  ),
);
