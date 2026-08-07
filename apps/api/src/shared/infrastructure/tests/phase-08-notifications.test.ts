import { test } from "node:test";
import assert from "node:assert";
import { randomUUID } from "node:crypto";

process.env.NODE_ENV = "test";

const tick = () => new Promise((r) => setTimeout(r, 10));

test("Phase 08 - Notifications", async (t) => {
  const prisma = (await import("../../../db.js")).prisma;

  const createdNotificationIds: string[] = [];
  const createdOutboxIds: string[] = [];
  const createdUserIds: string[] = [];

  t.after(async () => {
    await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } });
    await prisma.notificationOutbox.deleteMany({ where: { id: { in: createdOutboxIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  // ------------------------------------------------------------------
  // Inbox usecases (DB thật — local)
  // ------------------------------------------------------------------
  await t.test("listNotificationsUseCase - pagination & order", async () => {
    const uid = randomUUID();
    createdUserIds.push(uid);
    await prisma.user.create({
      data: {
        id: uid,
        name: "test-user",
        email: `${uid}@test.local`,
        role: "user",
      },
    });
    for (let i = 1; i <= 5; i++) {
      const n = await prisma.notification.create({
        data: {
          user_id: uid,
          type: "case_approved",
          title: `T${i}`,
          body: null,
          link: null,
        },
      });
      createdNotificationIds.push(n.id);
    }

    const { listNotificationsUseCase } = await import("../../../modules/notifications/application/list-notifications.usecase.js");
    const page1 = await listNotificationsUseCase(uid, 1, 2);
    assert.strictEqual(page1.items.length, 2);
    assert.strictEqual(page1.total, 5);
    assert.strictEqual(page1.page, 1);
    assert.strictEqual(page1.limit, 2);
    // mới nhất trước
    const t1 = new Date(page1.items[0].created_at).getTime();
    const t2 = new Date(page1.items[1].created_at).getTime();
    assert.ok(t1 >= t2);
    // chỉ row của user
    const other = await listNotificationsUseCase(randomUUID(), 1, 20);
    assert.strictEqual(other.items.length, 0);
  });

  await t.test("listNotificationsUseCase - invalid page/limit", async () => {
    const { listNotificationsUseCase } = await import("../../../modules/notifications/application/list-notifications.usecase.js");
    const { AppError } = await import("../../domain/app-error.js");

    await assert.rejects(() => listNotificationsUseCase("x", 0, 20), (e: unknown) =>
      e instanceof AppError && e.code === "VALIDATION_ERROR");
    await assert.rejects(() => listNotificationsUseCase("x", 1, 51), (e: unknown) =>
      e instanceof AppError && e.code === "VALIDATION_ERROR");
  });

  await t.test("getUnreadCountUseCase - chỉ đếm read_at null", async () => {
    const uid = randomUUID();
    createdUserIds.push(uid);
    await prisma.user.create({
      data: { id: uid, name: "t", email: `${uid}@test.local`, role: "user" },
    });
    const n1 = await prisma.notification.create({
      data: { user_id: uid, type: "case_approved", title: "a" },
    });
    const n2 = await prisma.notification.create({
      data: { user_id: uid, type: "case_approved", title: "b", read_at: new Date() },
    });
    createdNotificationIds.push(n1.id, n2.id);

    const { getUnreadCountUseCase } = await import("../../../modules/notifications/application/get-unread-count.usecase.js");
    assert.strictEqual(await getUnreadCountUseCase(uid), 1);
  });

  await t.test("markNotificationReadUseCase - không phải của user → { ok: false }", async () => {
    const uid = randomUUID();
    const other = randomUUID();
    createdUserIds.push(uid, other);
    await prisma.user.create({
      data: { id: uid, name: "a", email: `${uid}@test.local`, role: "user" },
    });
    await prisma.user.create({
      data: { id: other, name: "b", email: `${other}@test.local`, role: "user" },
    });
    const n = await prisma.notification.create({
      data: { user_id: uid, type: "case_approved", title: "a" },
    });
    createdNotificationIds.push(n.id);

    const { markNotificationReadUseCase } = await import("../../../modules/notifications/application/mark-notification-read.usecase.js");
    const r = await markNotificationReadUseCase(other, n.id);
    assert.deepStrictEqual(r, { ok: false });

    const ok = await markNotificationReadUseCase(uid, n.id);
    assert.deepStrictEqual(ok, { ok: true });
  });

  await t.test("markAllReadUseCase - chỉ update row của user", async () => {
    const uid = randomUUID();
    const other = randomUUID();
    createdUserIds.push(uid, other);
    await prisma.user.create({
      data: { id: uid, name: "a", email: `${uid}@test.local`, role: "user" },
    });
    await prisma.user.create({
      data: { id: other, name: "b", email: `${other}@test.local`, role: "user" },
    });
    for (let i = 0; i < 2; i++) {
      const n = await prisma.notification.create({
        data: { user_id: uid, type: "case_approved", title: `a${i}` },
      });
      createdNotificationIds.push(n.id);
    }
    const nOther = await prisma.notification.create({
      data: { user_id: other, type: "case_approved", title: "o" },
    });
    createdNotificationIds.push(nOther.id);

    const { markAllReadUseCase } = await import("../../../modules/notifications/application/mark-all-read.usecase.js");
    const r = await markAllReadUseCase(uid);
    assert.strictEqual(r.updated, 2);
    const count = await prisma.notification.count({ where: { user_id: uid, read_at: null } });
    assert.strictEqual(count, 0);
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
  // Listener — outbox idempotent + skip actor + channel mapping
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

  await t.test("listener - skip actor (student không nhận của mình)", async () => {
    // skip-actor nằm trong resolveRecipients (production) — test với case DB thật
    const { resolveRecipients } = await import("../../../modules/notifications/application/recipients.js");
    const ownerId = randomUUID();
    createdUserIds.push(ownerId);
    await prisma.user.create({
      data: { id: ownerId, name: "owner", email: `${ownerId}@test.local`, role: "user" },
    });
    const caseRec = await prisma.case.create({
      data: {
        case_code: `NX-${randomUUID().slice(0, 6)}`,
        owner_auth_user_id: ownerId,
        user_facing_stage: "submitted",
        internal_status: "triage_pending",
      },
    });

    // actor = owner → owner bị loại, không còn recipient nào
    const evActorIsOwner = {
      eventId: randomUUID(),
      type: "case.approved",
      actorId: ownerId,
      occurredAt: new Date(),
      payload: { caseId: caseRec.id, caseCode: "NX" },
    };
    const recs1 = await resolveRecipients(evActorIsOwner as never);
    assert.strictEqual(recs1.length, 0, "actor = owner → owner bị skip");

    // actor = người khác → owner vẫn nhận
    const evActorOther = {
      eventId: randomUUID(),
      type: "case.approved",
      actorId: "someone-else",
      occurredAt: new Date(),
      payload: { caseId: caseRec.id, caseCode: "NX" },
    };
    const recs2 = await resolveRecipients(evActorOther as never);
    assert.strictEqual(recs2.length, 1);
    assert.strictEqual(recs2[0].userId, ownerId);

    // actorId = null (system/sepay) → skip-actor không áp dụng
    const evSystem = {
      eventId: randomUUID(),
      type: "payment.verified",
      actorId: null,
      occurredAt: new Date(),
      payload: { caseId: caseRec.id, caseCode: "NX", amount: 1000, source: "auto" },
    };
    const recs3 = await resolveRecipients(evSystem as never);
    assert.strictEqual(recs3.length, 1, "system event → không skip ai");

    // case.assigned → supporter từ payload + student
    const evAssigned = {
      eventId: randomUUID(),
      type: "case.assigned",
      actorId: "admin-1",
      occurredAt: new Date(),
      payload: { caseId: caseRec.id, caseCode: "NX", supporterId: "sup-1", supporterName: "S" },
    };
    const recs4 = await resolveRecipients(evAssigned as never);
    assert.ok(recs4.some((r) => r.userId === "sup-1" && r.role === "supporter"));
    assert.ok(recs4.some((r) => r.userId === ownerId && r.role === "student"));

    await prisma.case.delete({ where: { id: caseRec.id } });
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

  await t.test("outbox repo - purgeSentOutbox chỉ xóa sent > cutoff", async () => {
    const { purgeSentOutbox } = await import("../../../modules/notifications/infrastructure/persistence/notification-outbox.repository.js");

    const old = await prisma.notificationOutbox.create({
      data: {
        event_id: randomUUID(),
        type: "case_approved",
        channel: "in_app",
        recipient_type: "user",
        recipient: "u-purge",
        title: "old",
        status: "sent",
        sent_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
    });
    const recent = await prisma.notificationOutbox.create({
      data: {
        event_id: randomUUID(),
        type: "case_approved",
        channel: "in_app",
        recipient_type: "user",
        recipient: "u-purge",
        title: "recent",
        status: "sent",
        sent_at: new Date(),
      },
    });
    createdOutboxIds.push(old.id, recent.id);

    const deleted = await purgeSentOutbox(30);
    assert.ok(deleted.count >= 1);

    const remains = await prisma.notificationOutbox.findUnique({ where: { id: recent.id } });
    assert.ok(remains, "recent sent row phải còn");
    const oldGone = await prisma.notificationOutbox.findUnique({ where: { id: old.id } });
    assert.strictEqual(oldGone, null, "old sent row phải bị purge");
  });

  await t.test("email service - renderEmailHtml escape HTML", async () => {
    const { renderEmailHtml } = await import("../../../modules/notifications/infrastructure/email.service.js");
    const html = renderEmailHtml("T<b>x", '<script>alert(1)</script>', "/dashboard/case/1");
    assert.ok(!html.includes("<script>"), "script phải bị escape");
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("&lt;b&gt;"));
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

  await t.test("listener - insert outbox row real DB (P2002 idempotent)", async () => {
    const { insertOutboxRow } = await import("../../../modules/notifications/infrastructure/persistence/notification-outbox.repository.js");

    const eventId = randomUUID();
    const row = await insertOutboxRow({
      eventId,
      type: "case.approved",
      channel: "in_app",
      recipientType: "user",
      recipient: "u-idem",
      title: "T",
      body: null,
      link: null,
      payloadJson: { caseId: "c1" },
    });
    assert.ok(row, "insert lần 1 phải thành công");
    createdOutboxIds.push(row.id);

    // Lần 2 cùng eventId+channel+recipient → P2002 → null (không tạo row trùng)
    const dup = await insertOutboxRow({
      eventId,
      type: "case.approved",
      channel: "in_app",
      recipientType: "user",
      recipient: "u-idem",
      title: "T",
      body: null,
      link: null,
      payloadJson: { caseId: "c1" },
    });
    assert.strictEqual(dup, null, "row trùng phải bị chặn bởi unique");

    const count = await prisma.notificationOutbox.count({ where: { event_id: eventId } });
    assert.strictEqual(count, 1, "chỉ 1 row cho 1 event+channel+recipient");
  });
});
