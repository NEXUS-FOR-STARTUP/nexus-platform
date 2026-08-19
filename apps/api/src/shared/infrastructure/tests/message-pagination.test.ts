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

test("listCaseMessages: page mới nhất trước, asc, cursor lùi về quá khứ, không trùng lặp", async (t) => {
  const { prisma } = await import("../../../db.js");
  const { listCaseMessages } = await import(
    "../../../modules/cases/infrastructure/persistence/case.repository.js"
  );
  const { decodeMessageCursor } = await import(
    "../../../modules/cases/application/message-cursor.js"
  );

  // 120 tin: m1 cũ nhất → m120 mới nhất, mỗi tin cách nhau 1 phút
  const all = Array.from({ length: 120 }, (_, i) => ({
    id: `m${i + 1}`,
    case_id: "case-1",
    created_at: new Date(Date.UTC(2026, 0, 1, 0, i)),
  }));

  const original = prisma.caseMessage.findMany;
  const capturedArgs: any[] = [];
  prisma.caseMessage.findMany = (async (args: any) => {
    capturedArgs.push(args);
    // Mô phỏng DB: lọc case_id + before, sort desc như orderBy được truyền xuống
    let rows = all.filter((m) => m.case_id === (args.where?.case_id ?? m.case_id));
    const or = args.where?.OR;
    if (Array.isArray(or)) {
      const ltTime: Date = or[0]?.created_at?.lt;
      const eqTime: Date = or[1]?.created_at;
      const ltId: string = or[1]?.id?.lt;
      rows = rows.filter((m) => {
        const t = m.created_at.getTime();
        return t < ltTime.getTime() || (t === eqTime.getTime() && m.id < ltId);
      });
    }
    rows.sort((a, b) => b.created_at.getTime() - a.created_at.getTime() || b.id.localeCompare(a.id));
    return rows.slice(0, args.take);
  }) as unknown as typeof prisma.caseMessage.findMany;

  try {
    const page1 = await listCaseMessages("case-1", { limit: 50 });
    // orderBy desc chính là chỗ bug cũ (asc trả về tin cũ nhất) — chặn tái phạm
    assert.deepStrictEqual(capturedArgs[0]?.orderBy, [
      { created_at: "desc" },
      { id: "desc" },
    ]);
    assert.strictEqual(capturedArgs[0]?.take, 51); // limit + 1 để tính hasMore

    // Page đầu = 50 tin MỚI NHẤT (m71..m120), thứ tự asc, cursor trỏ tin cũ nhất của page
    assert.strictEqual(page1.messages.length, 50);
    assert.strictEqual(page1.messages[0].id, "m71");
    assert.strictEqual(page1.messages[49].id, "m120");
    assert.ok(page1.next_cursor);
    const c1 = decodeMessageCursor(page1.next_cursor);
    assert.strictEqual(c1?.id, "m71");

    const page2 = await listCaseMessages("case-1", { limit: 50, before: c1! });
    assert.strictEqual(page2.messages[0].id, "m21");
    assert.strictEqual(page2.messages[49].id, "m70");
    const c2 = decodeMessageCursor(page2.next_cursor!);
    assert.strictEqual(c2?.id, "m21");

    const page3 = await listCaseMessages("case-1", { limit: 50, before: c2! });
    assert.strictEqual(page3.messages.length, 20);
    assert.strictEqual(page3.messages[0].id, "m1");
    assert.strictEqual(page3.messages[19].id, "m20");
    assert.strictEqual(page3.next_cursor, null);

    // Không trùng lặp/thiếu sót giữa các trang
    const ids = [...page1.messages, ...page2.messages, ...page3.messages].map((m) => m.id);
    assert.strictEqual(new Set(ids).size, 120);
  } finally {
    prisma.caseMessage.findMany = original;
  }
});
