import { test } from "node:test";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_ACTIVE_FIELDS,
  NOTIFICATION_PREFERENCE_RESERVED_FIELDS,
  UpdateNotificationPreferenceSchema,
  type NotificationPreference,
} from "@repo/validation";
import { AppError } from "../../domain/app-error.js";
import {
  getNotificationPreferencesUseCase,
  updateNotificationPreferencesUseCase,
} from "../../../modules/notifications/application/notification-preferences.usecase.js";
import { handleEvent } from "../../../modules/notifications/application/notification-listener.js";
import {
  ALL_ENABLED_PREFERENCE,
  allowsNotificationChannel,
} from "../../../modules/notifications/application/preference-policy.js";

process.env.NODE_ENV = "test";

const completePreference: NotificationPreference = {
  email_enabled: true,
  telegram_enabled: true,
  in_app_enabled: true,
  case_status_updates: true,
  chat_messages: true,
  payment_alerts: true,
  marketing_news: true,
};

function caseEvent(eventId = randomUUID()) {
  return {
    eventId,
    type: "case.assigned" as const,
    actorId: "actor-1",
    occurredAt: new Date(),
    payload: { caseId: "case-1", caseCode: "NX-1", supporterId: "sup-1", supporterName: "S" },
  };
}

function paymentEvent(eventId = randomUUID()) {
  return {
    eventId,
    type: "payment.verified" as const,
    actorId: "actor-1",
    occurredAt: new Date(),
    payload: { caseId: "case-1", caseCode: "NX-1", amount: 100000 },
  };
}

test("GA-08 notification preferences", async (t) => {
  await t.test("missing row GET materializes all seven fields true", async () => {
    const result = await getNotificationPreferencesUseCase("student-1", {
      findByUserId: async () => null,
    });

    assert.deepStrictEqual(
      {
        email_enabled: result.email_enabled,
        telegram_enabled: result.telegram_enabled,
        in_app_enabled: result.in_app_enabled,
        case_status_updates: result.case_status_updates,
        chat_messages: result.chat_messages,
        payment_alerts: result.payment_alerts,
        marketing_news: result.marketing_news,
      },
      { ...DEFAULT_NOTIFICATION_PREFERENCES },
    );
    assert.deepStrictEqual(result.active_fields, [...NOTIFICATION_PREFERENCE_ACTIVE_FIELDS]);
    assert.deepStrictEqual(result.reserved_fields, [...NOTIFICATION_PREFERENCE_RESERVED_FIELDS]);
  });

  await t.test("student and supporter GET stay scoped to caller userId", async () => {
    const seen: string[] = [];
    const findByUserId = async (userId: string) => {
      seen.push(userId);
      return userId === "supporter-1"
        ? { ...completePreference, email_enabled: false }
        : { ...completePreference, payment_alerts: false };
    };

    const student = await getNotificationPreferencesUseCase("student-1", { findByUserId });
    const supporter = await getNotificationPreferencesUseCase("supporter-1", { findByUserId });

    assert.deepStrictEqual(seen, ["student-1", "supporter-1"]);
    assert.strictEqual(student.payment_alerts, false);
    assert.strictEqual(student.email_enabled, true);
    assert.strictEqual(supporter.email_enabled, false);
    assert.strictEqual(supporter.payment_alerts, true);
  });

  await t.test("PUT complete state persists once; identical PUT does not create another row", async () => {
    const rows = new Map<string, NotificationPreference>();
    let upserts = 0;
    const upsert = async (userId: string, preference: NotificationPreference) => {
      upserts += 1;
      rows.set(userId, preference);
      return preference;
    };

    const first = await updateNotificationPreferencesUseCase("student-1", completePreference, { upsert });
    const second = await updateNotificationPreferencesUseCase("student-1", completePreference, { upsert });

    assert.strictEqual(rows.size, 1);
    assert.strictEqual(upserts, 2);
    assert.deepStrictEqual(first.email_enabled, true);
    assert.deepStrictEqual(second.case_status_updates, true);
  });

  await t.test("PUT rejects malformed booleans, unknown fields, and incomplete payload", () => {
    assert.strictEqual(UpdateNotificationPreferenceSchema.safeParse({ ...completePreference, email_enabled: "true" }).success, false);
    assert.strictEqual(UpdateNotificationPreferenceSchema.safeParse({ ...completePreference, extra: true }).success, false);
    assert.strictEqual(UpdateNotificationPreferenceSchema.safeParse({ email_enabled: true }).success, false);
  });

  await t.test("PUT invalid payload throws VALIDATION_ERROR without upsert", async () => {
    let called = false;
    await assert.rejects(
      () =>
        updateNotificationPreferencesUseCase("student-1", { email_enabled: true }, {
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

  await t.test("policy: group and channel gates; telegram never filtered", () => {
    const mixed = {
      ...ALL_ENABLED_PREFERENCE,
      case_status_updates: true,
      payment_alerts: false,
      in_app_enabled: true,
      email_enabled: false,
    };

    assert.strictEqual(allowsNotificationChannel(mixed, "case.assigned", "in_app"), true);
    assert.strictEqual(allowsNotificationChannel(mixed, "case.assigned", "email"), false);
    assert.strictEqual(allowsNotificationChannel(mixed, "payment.verified", "in_app"), false);
    assert.strictEqual(allowsNotificationChannel(mixed, "payment.verified", "email"), false);
    assert.strictEqual(allowsNotificationChannel(mixed, "payment.verified", "telegram"), true);
    assert.strictEqual(allowsNotificationChannel(mixed, "case.assigned", "telegram"), true);
  });

  await t.test("listener: case in-app only; payment creates no active-channel rows; queued row stays", async () => {
    const inserted: Array<{ eventId: string; channel: string; recipient: string }> = [];
    const queued = { eventId: "queued-1", channel: "email", recipient: "u1" };
    inserted.push(queued);

    const loadPreferences = async () =>
      new Map([
        [
          "u1",
          {
            case_status_updates: true,
            payment_alerts: false,
            in_app_enabled: true,
            email_enabled: false,
          },
        ],
      ]);

    const insert = async (data: { eventId: string; channel: string; recipient: string }) => {
      inserted.push({ eventId: data.eventId, channel: data.channel, recipient: data.recipient });
      return { id: randomUUID() };
    };

    const student = [{ userId: "u1", email: "u1@x.com", role: "student" as const }];
    const caseOne = caseEvent();
    await handleEvent(caseOne as never, {
      resolve: async () => student,
      channels: () => ["in_app", "email"],
      insert,
      loadPreferences,
    } as never);

    const paymentOne = paymentEvent();
    await handleEvent(paymentOne as never, {
      resolve: async () => student,
      channels: () => ["in_app", "email"],
      insert,
      loadPreferences,
    } as never);

    assert.deepStrictEqual(
      inserted.filter((row) => row.eventId === caseOne.eventId),
      [{ eventId: caseOne.eventId, channel: "in_app", recipient: "u1" }],
    );
    assert.strictEqual(inserted.some((row) => row.eventId === paymentOne.eventId), false);
    assert.deepStrictEqual(inserted[0], queued);

    const restored = async () =>
      new Map([
        [
          "u1",
          {
            case_status_updates: true,
            payment_alerts: true,
            in_app_enabled: true,
            email_enabled: true,
          },
        ],
      ]);

    const paymentTwo = paymentEvent();
    await handleEvent(paymentTwo as never, {
      resolve: async () => student,
      channels: () => ["in_app", "email"],
      insert,
      loadPreferences: restored,
    } as never);

    const paymentTwoRows = inserted.filter((row) => row.eventId === paymentTwo.eventId);
    assert.deepStrictEqual(
      paymentTwoRows.map((row) => row.channel).sort(),
      ["email", "in_app"],
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
