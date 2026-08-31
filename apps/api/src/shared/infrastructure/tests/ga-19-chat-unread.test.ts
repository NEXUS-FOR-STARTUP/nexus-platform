import { test } from "node:test";
import assert from "node:assert/strict";
import { markChatReadUseCase } from "../../../modules/cases/application/mark-chat-read.usecase.js";
import { getChatUnreadCountUseCase } from "../../../modules/cases/application/get-chat-unread-count.usecase.js";
import { buildChatReadMessage } from "../../../modules/realtime/domain/realtime.types.js";
import {
  MarkChatReadRequestSchema,
  MarkChatReadResponseSchema,
  CaseUnreadCountResponseSchema,
} from "@repo/validation";

test("GA-19: Chat Unread-Per-User Test Suite", async (t) => {
  const mockCaseId = "case-test-ga19-uuid";
  const mockUserId = "user-test-ga19-uuid";
  const mockMessageId = "msg-test-ga19-uuid";
  const mockTimestamp = new Date("2026-08-27T10:00:00.000Z");

  await t.test("1. MarkChatReadRequestSchema & ResponseSchema validation", () => {
    const validReq = MarkChatReadRequestSchema.parse({ last_read_message_id: mockMessageId });
    assert.equal(validReq.last_read_message_id, mockMessageId);

    const emptyReq = MarkChatReadRequestSchema.parse({});
    assert.equal(emptyReq.last_read_message_id, undefined);

    const validRes = MarkChatReadResponseSchema.parse({
      success: true,
      unread_count: 0,
      last_read_at: mockTimestamp.toISOString(),
    });
    assert.equal(validRes.success, true);
    assert.equal(validRes.unread_count, 0);

    const unreadRes = CaseUnreadCountResponseSchema.parse({
      unread_count: 5,
      last_read_at: mockTimestamp.toISOString(),
    });
    assert.equal(unreadRes.unread_count, 5);
  });

  await t.test("2. buildChatReadMessage builds correct Centrifugo payload", () => {
    const payload = buildChatReadMessage(
      mockCaseId,
      mockUserId,
      mockTimestamp.toISOString(),
      mockMessageId,
    );

    assert.equal(payload.type, "chat:read");
    assert.equal(payload.case_id, mockCaseId);
    assert.equal(payload.user_id, mockUserId);
    assert.equal(payload.last_read_at, mockTimestamp.toISOString());
    assert.equal(payload.last_read_message_id, mockMessageId);
  });

  await t.test("3. markChatReadUseCase updates state and broadcasts Centrifugo chat:read event", async () => {
    let publishedChannel = "";
    let publishedPayload: any = null;
    let upsertCalledWith: any = null;

    const fakeUpsert = async (caseId: string, userId: string, lastReadMessageId?: string) => {
      upsertCalledWith = { caseId, userId, lastReadMessageId };
      return {
        id: "read-state-id",
        case_id: caseId,
        user_id: userId,
        last_read_message_id: lastReadMessageId ?? null,
        last_read_at: mockTimestamp,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      };
    };

    const fakePublish = async (channel: string, payload: any) => {
      publishedChannel = channel;
      publishedPayload = payload;
    };

    const result = await markChatReadUseCase(
      mockUserId,
      "user",
      mockCaseId,
      mockMessageId,
      {
        upsertCaseChatReadState: fakeUpsert as any,
        publishToChannel: fakePublish as any,
      },
    );

    assert.equal(result.success, true);
    assert.equal(result.unread_count, 0);
    assert.equal(result.last_read_at, mockTimestamp.toISOString());

    assert.deepEqual(upsertCalledWith, {
      caseId: mockCaseId,
      userId: mockUserId,
      lastReadMessageId: mockMessageId,
    });

    assert.equal(publishedChannel, `chat:${mockCaseId}`);
    assert.equal(publishedPayload?.type, "chat:read");
    assert.equal(publishedPayload?.case_id, mockCaseId);
    assert.equal(publishedPayload?.user_id, mockUserId);
    assert.equal(publishedPayload?.last_read_message_id, mockMessageId);
  });

  await t.test("4. getChatUnreadCountUseCase returns unread count and last_read_at", async () => {
    const fakeGetCount = async (caseId: string, userId: string) => {
      assert.equal(caseId, mockCaseId);
      assert.equal(userId, mockUserId);
      return 3;
    };

    const fakeGetReadState = async (caseId: string, userId: string) => {
      assert.equal(caseId, mockCaseId);
      assert.equal(userId, mockUserId);
      return {
        id: "read-state-1",
        case_id: caseId,
        user_id: userId,
        last_read_message_id: "msg-123",
        last_read_at: mockTimestamp,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      };
    };

    const result = await getChatUnreadCountUseCase(
      mockCaseId,
      mockUserId,
      {
        getUnreadMessageCount: fakeGetCount as any,
        getCaseChatReadState: fakeGetReadState as any,
      },
    );

    assert.equal(result.unread_count, 3);
    assert.equal(result.last_read_at, mockTimestamp.toISOString());
  });

  await t.test("5. getChatUnreadCountUseCase returns undefined last_read_at for first-time user", async () => {
    const fakeGetCount = async () => 0;
    const fakeGetReadState = async () => null;

    const result = await getChatUnreadCountUseCase(
      mockCaseId,
      mockUserId,
      {
        getUnreadMessageCount: fakeGetCount as any,
        getCaseChatReadState: fakeGetReadState as any,
      },
    );

    assert.equal(result.unread_count, 0);
    assert.equal(result.last_read_at, undefined);
  });
});
