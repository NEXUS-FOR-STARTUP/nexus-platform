import { test } from "node:test";
import assert from "node:assert";
import { canAdminCreditDeposit } from "../../../modules/deposits/domain/deposit.types.js";

test("canAdminCreditDeposit guard rules", async (t) => {
  await t.test("pending deposit without proof cannot be credited by admin", () => {
    assert.strictEqual(canAdminCreditDeposit({ status: "pending", proof_file_url: null }), false);
    assert.strictEqual(canAdminCreditDeposit({ status: "pending", proof_file_url: "" }), false);
    assert.strictEqual(canAdminCreditDeposit({ status: "pending", proof_file_url: "   " }), false);
  });

  await t.test("pending deposit with proof can be credited by admin", () => {
    assert.strictEqual(
      canAdminCreditDeposit({ status: "pending", proof_file_url: "https://proof.example/bill.png" }),
      true,
    );
  });

  await t.test("amount_mismatch deposit without proof cannot be credited by admin", () => {
    assert.strictEqual(
      canAdminCreditDeposit({ status: "amount_mismatch", proof_file_url: null }),
      false,
    );
    assert.strictEqual(
      canAdminCreditDeposit({ status: "amount_mismatch", proof_file_url: "" }),
      false,
    );
    assert.strictEqual(
      canAdminCreditDeposit({ status: "amount_mismatch", proof_file_url: "   " }),
      false,
    );
  });

  await t.test("amount_mismatch deposit with proof can be credited by admin", () => {
    assert.strictEqual(
      canAdminCreditDeposit({ status: "amount_mismatch", proof_file_url: "https://proof.example/bill.png" }),
      true,
    );
  });
});
