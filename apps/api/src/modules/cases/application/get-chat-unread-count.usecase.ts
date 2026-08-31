import {
  getUnreadMessageCount,
  getCaseChatReadState,
} from "../infrastructure/persistence/case.repository.js";

export interface GetChatUnreadCountResult {
  unread_count: number;
  last_read_at?: string;
}

const defaultDeps = {
  getUnreadMessageCount,
  getCaseChatReadState,
};

export async function getChatUnreadCountUseCase(
  caseId: string,
  userId: string,
  deps: Partial<typeof defaultDeps> = {},
): Promise<GetChatUnreadCountResult> {
  const { getUnreadMessageCount: getCount, getCaseChatReadState: getReadState } = {
    ...defaultDeps,
    ...deps,
  };

  const [unreadCount, readState] = await Promise.all([
    getCount(caseId, userId),
    getReadState(caseId, userId),
  ]);

  return {
    unread_count: unreadCount,
    last_read_at: readState?.last_read_at ? readState.last_read_at.toISOString() : undefined,
  };
}
