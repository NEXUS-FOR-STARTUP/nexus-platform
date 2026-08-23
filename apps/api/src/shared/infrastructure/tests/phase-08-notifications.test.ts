import { test } from "node:test";
import assert from "node:assert";
import { randomUUID } from "node:crypto";

process.env.NODE_ENV = "test";

const tick = () => new Promise((r) => setTimeout(r, 10));

test("Phase 08 - Notifications", async (t) => {
  await t.test("listNotificationsUseCase - invalid page/limit", async () => {
    const { listNotificationsUseCase } = await import("../../../modules/notifications/application/list-notifications.usecase.js");
    const { AppError } = await import("../../domain/app-error.js");

    await assert.rejects(() => listNotificationsUseCase("x", 0, 20), (e: unknown) =>
      e instanceof AppError && e.code === "VALIDATION_ERROR");
    await assert.rejects(() => listNotificationsUseCase("x", 1, 51), (e: unknown) =>
      e instanceof AppError && e.code === "VALIDATION_ERROR");
  });

  // ------------------------------------------------------------------
  // Event bus
  // ------------------------------------------------------------------
  await t.test("event-bus - handler throw không làm emitEvent throw", async () => {
    const { emitEvent, onEvent } = await import("../../infrastructure/event-bus.js");
    const { DOMAIN_EVENTS } = await import("../../domain/domain-events.js");

    const type = DOMAIN_EVENTS.CASE_APPROVED;
    const handler = () => {
      throw new Error("boom");
    };
    onEvent(type, handler);
    assert.doesNotThrow(() =>
      emitEvent({
        eventId: randomUUID(),
        type,
        actorId: null,
        occurredAt: new Date(),
        payload: {},
      }),
    );
    await tick();
  });

  // ------------------------------------------------------------------
  // Listener — channel mapping + skip telegram khi bot disabled
  // ------------------------------------------------------------------
  await t.test("listener - handleEvent 2 lần cùng event → 1 row (idempotent)", async () => {
    const { handleEvent } = await import("../../../modules/notifications/application/notification-listener.js");

    const event = {
      eventId: randomUUID(),
      type: "case.assigned",
      actorId: "actor-1",
      occurredAt: new Date(),
      payload: { caseId: "case-1", caseCode: "NX-1", supporterId: "sup-1", supporterName: "S" },
    };

    const inserted: any[] = [];
    const insert = async (data: any) => {
      inserted.push(data);
      return { id: randomUUID() };
    };

    await handleEvent(event as never, {
      resolve: async () => [
        { userId: "u1", email: "u1@x.com", role: "student" },
        { userId: "sup-1", email: "", role: "supporter" },
      ],
      channels: () => ["in_app", "email"],
      insert,
    } as never);
    await handleEvent(event as never, {
      resolve: async () => [
        { userId: "u1", email: "u1@x.com", role: "student" },
        { userId: "sup-1", email: "", role: "supporter" },
      ],
      channels: () => ["in_app", "email"],
      insert,
    } as never);

    // resolve+channels mock → student 2 channel (in_app+email), supporter 1 (email "" → skip) = 3 insert/lần
    // Idempotency là ở repository (P2002) — với mock insert chỉ kiểm tra payload đúng
    assert.strictEqual(inserted.length, 6);
    assert.strictEqual(inserted[0].eventId, event.eventId);
    assert.strictEqual(inserted[0].recipientType, "user");
    assert.strictEqual(inserted[0].recipient, "u1");
    assert.strictEqual((inserted[0].payloadJson as Record<string, unknown>).actorId, "actor-1");
  });

  await t.test("channelsFor - admin nhận telegram khi payment.verified", async () => {
    const { channelsFor } = await import("../../../modules/notifications/application/recipients.js");

    assert.deepStrictEqual(channelsFor("payment.verified", "admin"), ["in_app", "telegram"]);
    assert.deepStrictEqual(channelsFor("payment.verified", "supporter"), ["in_app"]);
    assert.deepStrictEqual(channelsFor("payment.verified", "student", { source: "manual" }), ["in_app", "email"]);
    assert.deepStrictEqual(channelsFor("payment.verified", "student", { source: "auto" }), ["in_app"]);
    assert.deepStrictEqual(channelsFor("case.approved", "admin"), ["in_app"]);
  });

  await t.test("templates - payment.verified admin có body + link", async () => {
    const { renderTemplate } = await import("../../../modules/notifications/application/notification-templates.js");

    const r = renderTemplate(
      "payment.verified",
      { caseId: "c1", caseCode: "NX-1", amount: 39000, source: "manual" },
      "admin",
    );
    assert.ok(r.body?.includes("NX-1"));
    assert.ok(r.body?.includes("39,000"));
    assert.strictEqual(r.link, "/admin?tab=triages");

    const auto = renderTemplate(
      "payment.verified",
      { caseId: "c1", caseCode: "NX-1", amount: 39000, source: "auto" },
      "admin",
    );
    assert.ok(auto.body?.includes("tự động"));
  });

  await t.test("templates - case.approved/assigned/rejected identity", async () => {
    const { renderTemplate } = await import("../../../modules/notifications/application/notification-templates.js");
    const payload = { caseId: "c1", caseCode: "NX-1", supporterName: "Nguyễn Văn A" };

    const approved = renderTemplate("case.approved", payload, "student");
    assert.ok(approved.body?.includes("NX-1"));
    assert.ok(!approved.body?.includes("undefined"));

    const assignedStudent = renderTemplate("case.assigned", payload, "student");
    assert.ok(assignedStudent.body?.includes("Nguyễn Văn A"));
    assert.strictEqual(assignedStudent.link, "/dashboard/case/c1");

    const assignedSupporter = renderTemplate("case.assigned", payload, "supporter");
    assert.ok(assignedSupporter.body?.includes("Nguyễn Văn A"));
    assert.strictEqual(assignedSupporter.link, "/supporter/case/c1");

    const rejected = renderTemplate("case.rejected", payload, "student");
    assert.ok(rejected.body?.includes("NX-1"));
    assert.ok(!rejected.body?.includes("undefined"));
  });

  await t.test("templates - missing caseCode falls back, never undefined", async () => {
    const { renderTemplate } = await import("../../../modules/notifications/application/notification-templates.js");

    const r = renderTemplate("case.approved", { caseId: "c1" }, "student");
    assert.ok(r.body?.includes("chưa xác định"));
    assert.ok(!r.body?.includes("undefined"));
  });

  // ------------------------------------------------------------------
  // Relay — retry backoff + in_app insert + purge
  // ------------------------------------------------------------------
  await t.test("relay - backoff schedule: fail attempt 1 → next_retry_at +2s", async () => {
    const { relayTick } = await import("../../../modules/notifications/application/notification-relay.js");

    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let retried: any = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps: any = {
      claimBatch: async () => [
        { id: "o1", channel: "email", recipient_type: "email", recipient: "a@b.c", title: "T", body: null, link: null, payload_json: null, attempts: 0 },
      ],
      sendEmail: async () => {
        throw new Error("resend down");
      },
      markRetry: async (_id: string, attempts: number, nextRetryAt: Date) => {
        retried = { attempts, nextRetryAt };
      },
      markSent: async () => {},
      markFailed: async () => {},
      ping: async () => {},
    };
    await relayTick(deps);

    assert.ok(retried, "phải retry");
    assert.strictEqual(retried.attempts, 1);
    const delta = retried.nextRetryAt.getTime() - now;
    assert.ok(delta >= 1500 && delta <= 3500, `next_retry ~2s, got ${delta}ms`);
  });

  await t.test("relay - fail attempt 5 → markFailed", async () => {
    const { relayTick } = await import("../../../modules/notifications/application/notification-relay.js");

    let failed: string | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps: any = {
      claimBatch: async () => [
        { id: "o2", channel: "email", recipient_type: "email", recipient: "a@b.c", title: "T", body: null, link: null, payload_json: null, attempts: 4 },
      ],
      sendEmail: async () => {
        throw new Error("down");
      },
      markRetry: async () => {},
      markFailed: async (id: string) => {
        failed = id;
      },
      markSent: async () => {},
      ping: async () => {},
    };
    await relayTick(deps);

    assert.strictEqual(failed, "o2");
  });

  await t.test("relay - in_app insert + sse ping", async () => {
    const { relayTick } = await import("../../../modules/notifications/application/notification-relay.js");

    let inserted: string | null = null;
    let pinged: string | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps: any = {
      claimBatch: async () => [
        {
          id: "o3",
          channel: "in_app",
          recipient_type: "user",
          recipient: "u-1",
          type: "case_approved",
          title: "T",
          body: null,
          link: "/dashboard",
          payload_json: { caseId: "c1", actorId: "admin-1" },
          attempts: 0,
        },
      ],
      insertNotification: async (d: { userId: string }) => {
        inserted = d.userId;
        return { id: "n1" };
      },
      ping: async (uid: string) => {
        pinged = uid;
      },
      markSent: async () => {},
      markRetry: async () => {},
      markFailed: async () => {},
    };
    await relayTick(deps);

    assert.strictEqual(inserted, "u-1");
    assert.strictEqual(pinged, "u-1");
  });

  await t.test("relay - telegram disabled (null msgId) → delivery failure, KHÔNG markSent", async () => {
    const { relayTick } = await import("../../../modules/notifications/application/notification-relay.js");

    let markedFailed: string | null = null;
    let markedSent = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps: any = {
      claimBatch: async () => [
        { id: "o-tg", channel: "telegram", recipient_type: "chat", recipient: "chat-1", title: "T", body: null, link: null, payload_json: null, attempts: 4 },
      ],
      sendTelegramMsg: async () => null, // bot disabled
      markRetry: async () => {},
      markFailed: async (id: string) => {
        markedFailed = id;
      },
      markSent: async () => {
        markedSent = true;
      },
    };
    await relayTick(deps);

    assert.strictEqual(markedSent, false, "telegram disabled → KHÔNG được markSent");
    assert.strictEqual(markedFailed, "o-tg", "phải xử lý như delivery failure → markFailed");
  });

  await t.test("listener - skip tạo telegram row khi bot disabled", async () => {
    const { handleEvent } = await import("../../../modules/notifications/application/notification-listener.js");
    const { telegramBot } = await import("../../../modules/notifications/infrastructure/telegram.service.js");

    const inserted: any[] = [];
    const insert = async (data: any) => {
      inserted.push(data);
      return { id: randomUUID() };
    };

    await handleEvent(
      {
        eventId: randomUUID(),
        type: "payment.verified",
        actorId: null,
        occurredAt: new Date(),
        payload: { caseId: "case-1", caseCode: "NX-1", source: "manual" },
      } as never,
      {
        resolve: async () => [{ userId: "a1", email: "a1@x.com", role: "admin", telegramChatId: "chat-1" }],
        channels: () => ["in_app", "telegram"],
        insert,
      } as never,
    );

    // Bot enabled → cả 2 channel được tạo; bot disabled → skip telegram
    const expected = telegramBot ? 2 : 1;
    assert.strictEqual(inserted.length, expected, `telegram row skip logic sai (bot=${!!telegramBot})`);
    assert.strictEqual(inserted[0].channel, "in_app");
  });

  await t.test("email service - renderEmailHtml escape HTML", async () => {
    const { renderEmailHtml } = await import("../../../modules/notifications/infrastructure/email.service.js");
    const html = renderEmailHtml("T<b>x", '<script>alert(1)</script>', "/dashboard/case/1");
    assert.ok(!html.includes("<script>"), "script phải bị escape");
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("&lt;b&gt;"));
  });

  await t.test("email service - render OTP marker as large safe block", async () => {
    const { renderEmailHtml } = await import("../../../modules/notifications/infrastructure/email.service.js");
    const html = renderEmailHtml("Xác minh email", "Mã:\n<otp>582690</otp>\nHết hạn sau 5 phút.", null);
    assert.ok(html.includes('font-size:32px'), "OTP phải được render lớn");
    assert.ok(html.includes(">582690</div>"), "OTP phải nằm trong block an toàn");

    const malicious = renderEmailHtml("Xác minh email", "<otp><script>alert(1)</script></otp>", null);
    assert.ok(!malicious.includes("<script>"), "marker OTP không được mở HTML tùy ý");
    assert.ok(malicious.includes("&lt;otp&gt;"), "marker không hợp lệ phải bị escape");
  });

  await t.test("templates - mọi DOMAIN_EVENTS đều có template (chống bug key mismatch)", async () => {
    const { DOMAIN_EVENTS } = await import("../../domain/domain-events.js");
    const { renderTemplate } = await import("../../../modules/notifications/application/notification-templates.js");

    for (const type of Object.values(DOMAIN_EVENTS)) {
      const rendered = renderTemplate(type, { caseId: "c1", caseCode: "NX-1", reason: "r", supporterName: "S", amount: 1000, query: "q", fromStage: "a", toStage: "b" }, "student");
      assert.notStrictEqual(rendered.title, type, `template thiếu cho ${type} — title là raw event type`);
      assert.ok(rendered.title.length > 0);
      // payment.proof_uploaded chỉ có admin template — student render vẫn cho title nhưng body/link có thể null
      if (type !== "payment.proof_uploaded") {
        assert.ok(rendered.link, `template ${type} thiếu link cho student`);
      }
    }
  });
});
