import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("Message pagination helpers", async (t) => {
  const { encodeMessageCursor, decodeMessageCursor, parseMessageLimit } =
    await import("../../../modules/cases/application/message-cursor.js");

  await t.test("cursor round-trip", () => {
    const d = new Date("2026-08-19T10:00:00.000Z");
    const decoded = decodeMessageCursor(encodeMessageCursor(d, "id-123"));
    assert.ok(decoded);
    assert.strictEqual(decoded.createdAt.toISOString(), d.toISOString());
    assert.strictEqual(decoded.id, "id-123");
  });

  await t.test("invalid cursor → null", () => {
    assert.strictEqual(decodeMessageCursor("@@@"), null);
    assert.strictEqual(
      decodeMessageCursor(Buffer.from("khong-co-separator").toString("base64url")),
      null,
    );
    assert.strictEqual(
      decodeMessageCursor(Buffer.from("khong-phai-ngay|id-1").toString("base64url")),
      null,
    );
    assert.strictEqual(
      decodeMessageCursor(Buffer.from("2026-08-19T10:00:00.000Z|").toString("base64url")),
      null,
    );
  });

  await t.test("limit parsing clamp", () => {
    assert.strictEqual(parseMessageLimit(undefined), 50);
    assert.strictEqual(parseMessageLimit("abc"), 50);
    assert.strictEqual(parseMessageLimit("0"), 1);
    assert.strictEqual(parseMessageLimit("500"), 100);
    assert.strictEqual(parseMessageLimit("25"), 25);
  });
});

test("listMessagesUseCase forwards options to repository", async () => {
  const { listMessagesUseCase } = await import(
    "../../../modules/cases/application/list-messages.usecase.js"
  );
  let captured: any;
  const result = await listMessagesUseCase(
    "case-1",
    { limit: 25, before: { createdAt: new Date("2026-01-01T00:00:00Z"), id: "m-1" } },
    {
      listCaseMessages: async (caseId: string, opts: any) => {
        captured = { caseId, opts };
        return { messages: [], next_cursor: null };
      },
    },
  );
  assert.deepStrictEqual(captured, {
    caseId: "case-1",
    opts: { limit: 25, before: { createdAt: new Date("2026-01-01T00:00:00Z"), id: "m-1" } },
  });
  assert.deepStrictEqual(result, { messages: [], next_cursor: null });
});
