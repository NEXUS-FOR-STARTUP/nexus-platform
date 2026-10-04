import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../modules");

test("deposit verification never buys case credit", () => {
  const verify = readFileSync(
    join(root, "deposits/application/verify-deposit.usecase.ts"),
    "utf8",
  );
  const sepay = readFileSync(
    join(root, "payments/application/sepay-webhook.usecase.ts"),
    "utf8",
  );
  for (const src of [verify, sepay]) {
    assert.equal(src.includes("createOrderUseCase"), false);
    assert.equal(src.includes("creditLedger"), false);
    assert.equal(src.includes("CREDIT_AUDIT"), false);
  }
  assert.equal(verify.includes("walletService.deposit"), true);
  assert.equal(sepay.includes("walletService.deposit"), true);
});
