import { test } from "node:test";
import assert from "node:assert";
import { InsufficientBalanceError } from "../../../modules/wallet/domain/wallet.types.js";

process.env.NODE_ENV = "test";

test("InsufficientBalanceError exposes current and required in details", () => {
  const err = new InsufficientBalanceError(33000, 39000);

  assert.equal(err.status, 400);
  assert.equal(err.code, "INSUFFICIENT_BALANCE");
  assert.deepEqual(err.details, { current: 33000, required: 39000 });
});

test("InsufficientBalanceError message formats balance and required amount", () => {
  const err = new InsufficientBalanceError(33000, 39000);

  assert.match(err.message, /33\.000/);
  assert.match(err.message, /39\.000/);
});
