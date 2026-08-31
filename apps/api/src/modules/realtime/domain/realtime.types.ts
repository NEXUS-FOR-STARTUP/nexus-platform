export const REALTIME_CHANNEL_PREFIX = "chat";
export const REALTIME_CHANNEL_NAMESPACE = "chat";
export const TOKEN_TTL_SECONDS = 15 * 60;

export function chatChannel(caseId: string): string {
  return `${REALTIME_CHANNEL_NAMESPACE}:${caseId}`;
}

export interface CaseDeletedMessage {
  type: "case_deleted";
  caseId: string;
}

export function buildCaseDeletedMessage(caseId: string): CaseDeletedMessage {
  return { type: "case_deleted", caseId };
}

export interface ChatReadEventPayload {
  type: "chat:read";
  case_id: string;
  user_id: string;
  last_read_message_id?: string | null;
  last_read_at: string;
}

export function buildChatReadMessage(
  caseId: string,
  userId: string,
  lastReadAt: string,
  lastReadMessageId?: string | null,
): ChatReadEventPayload {
  return {
    type: "chat:read",
    case_id: caseId,
    user_id: userId,
    last_read_at: lastReadAt,
    last_read_message_id: lastReadMessageId ?? null,
  };
}
