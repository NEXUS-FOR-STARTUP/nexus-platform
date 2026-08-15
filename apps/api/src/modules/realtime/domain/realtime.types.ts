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
