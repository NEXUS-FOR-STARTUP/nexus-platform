import { test } from "node:test";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  UpdateNotificationPreferenceSchema,
  type NotificationPreference,
} from "@repo/validation";
import { AppError } from "../../domain/app-error.js";
import {
  getNotificationPreferencesUseCase,
  updateNotificationPreferencesUseCase,
} from "../../../modules/notifications/application/notification-preferences.usecase.js";
import { handleEvent } from "../../../modules/notifications/application/notification-listener.js";
import { allowsNotificationChannel } from "../../../modules/notifications/application/preference-policy.js";

process.env.NODE_ENV = "test";

const completePreference: NotificationPreference = { email_enabled: true };

function caseEvent(eventId = randomUUID()) {
  return {
    eventId,
    type: "case.assigned" as const,
    actorId: "actor-1",
    occurredAt: new Date(),
    payload: { caseId: "case-1", caseCode: "NX-1", supporterId: "sup-1", supporterName: "S" },
  };
}

test("GA-08 notification preferences", async (t) => {
  await t.test("missing row GET materializes email_enabled true", async () => {
    const result = await getNotificationPreferencesUseCase("student-1", {
      findByUserId: async () => null,
    });

    assert.deepStrictEqual(result, { ...DEFAULT_NOTIFICATION_PREFERENCES });
  });

  await t.test("student and supporter GET stay scoped to caller userId", async () => {
    const seen: string[] = [];
    const findByUserId = async (userId: string) => {
      seen.push(userId);
      return userId === "supporter-1"
        ? { email_enabled: false }
        : { email_enabled: true };
    };

    const student = await getNotificationPreferencesUseCase("student-1", { findByUserId });
    const supporter = await getNotificationPreferencesUseCase("supporter-1", { findByUserId });

    assert.deepStrictEqual(seen, ["student-1", "supporter-1"]);
    assert.strictEqual(student.email_enabled, true);
    assert.strictEqual(supporter.email_enabled, false);
  });

  await t.test("PUT email_enabled false persists; GET returns false", async () => {
    const rows = new Map<string, NotificationPreference>();
    const upsert = async (userId: string, preference: NotificationPreference) => {
      rows.set(userId, preference);
      return preference;
    };

    const saved = await updateNotificationPreferencesUseCase(
      "student-1",
      { email_enabled: false },
      { upsert },
    );
    const loaded = await getNotificationPreferencesUseCase("student-1", {
      findByUserId: async (userId) => rows.get(userId) ?? null,
    });

    assert.strictEqual(saved.email_enabled, false);
    assert.strictEqual(loaded.email_enabled, false);
  });

  await t.test("PUT rejects unknown fields and non-booleans", () => {
    assert.strictEqual(UpdateNotificationPreferenceSchema.safeParse({ email_enabled: true }).success, true);
    assert.strictEqual(UpdateNotificationPreferenceSchema.safeParse({ email_enabled: "true" }).success, false);
    assert.strictEqual(UpdateNotificationPreferenceSchema.safeParse({ email_enabled: true, extra: true }).success, false);
  });

  await t.test("PUT invalid payload throws VALIDATION_ERROR without upsert", async () => {
    let called = false;
    await assert.rejects(
      () =>
        updateNotificationPreferencesUseCase("student-1", { email_enabled: true, extra: true }, {
          upsert: async () => {
            called = true;
            return completePreference;
          },
        }),
      (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR" && error.status === 400,
    );
    assert.strictEqual(called, false);
  });

  await t.test("PUT cannot write another user's row", async () => {
    const upsert = async (userId: string, preference: NotificationPreference) => {
      assert.strictEqual(userId, "student-1");
      return preference;
    };
    await updateNotificationPreferencesUseCase("student-1", completePreference, { upsert });
  });

  await t.test("policy: in_app and telegram always on; email follows flag", () => {
    const emailOff = { email_enabled: false };

    assert.strictEqual(allowsNotificationChannel(emailOff, "case.assigned", "in_app"), true);
    assert.strictEqual(allowsNotificationChannel(emailOff, "case.assigned", "email"), false);
    assert.strictEqual(allowsNotificationChannel(emailOff, "case.assigned", "telegram"), true);
    assert.strictEqual(allowsNotificationChannel({ email_enabled: true }, "payment.verified", "email"), true);
  });

  await t.test("listener: email off skips email outbox; in_app still inserts", async () => {
    const inserted: Array<{ eventId: string; channel: string; recipient: string }> = [];
    const queued = { eventId: "queued-1", channel: "email", recipient: "u1" };
    inserted.push(queued);

    const insert = async (data: { eventId: string; channel: string; recipient: string }) => {
      inserted.push({ eventId: data.eventId, channel: data.channel, recipient: data.recipient });
      return { id: randomUUID() };
    };

    const student = [{ userId: "u1", email: "u1@x.com", role: "student" as const }];
    const event = caseEvent();
    await handleEvent(event as never, {
      resolve: async () => student,
      channels: () => ["in_app", "email"],
      insert,
      loadPreferences: async () => new Map([["u1", { email_enabled: false }]]),
    } as never);

    assert.deepStrictEqual(
      inserted.filter((row) => row.eventId === event.eventId),
      [{ eventId: event.eventId, channel: "in_app", recipient: "u1" }],
    );
    assert.deepStrictEqual(inserted[0], queued);
  });

  await t.test("listener: preference load throw still enqueues (fail-open)", async () => {
    const inserted: Array<{ channel: string }> = [];
    await handleEvent(caseEvent() as never, {
      resolve: async () => [{ userId: "u1", email: "u1@x.com", role: "student" }],
      channels: () => ["in_app", "email"],
      insert: async (data: { channel: string }) => {
        inserted.push({ channel: data.channel });
        return { id: randomUUID() };
      },
      loadPreferences: async () => {
        throw new Error("preference table missing");
      },
    } as never);

    assert.deepStrictEqual(
      inserted.map((row) => row.channel).sort(),
      ["email", "in_app"],
    );
  });
});
