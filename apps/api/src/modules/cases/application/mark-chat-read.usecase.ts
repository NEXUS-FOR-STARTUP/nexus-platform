import { upsertCaseChatReadState } from "../infrastructure/persistence/case.repository.js";
import { publishToChannel } from "../../realtime/infrastructure/centrifugo.service.js";
import { chatChannel, buildChatReadMessage } from "../../realtime/domain/realtime.types.js";
import logger from "../../../shared/infrastructure/logger.js";

export interface MarkChatReadResult {
  success: boolean;
  unread_count: number;
  last_read_at: string;
}

const defaultDeps = {
  upsertCaseChatReadState,
  publishToChannel,
};

export async function markChatReadUseCase(
  userId: string,
  _userRole: string,
  caseId: string,
  lastReadMessageId?: string,
  deps: Partial<typeof defaultDeps> = {},
): Promise<MarkChatReadResult> {
  const { upsertCaseChatReadState: upsertRepo, publishToChannel: publish } = {
    ...defaultDeps,
    ...deps,
  };

  const readState = await upsertRepo(caseId, userId, lastReadMessageId);
  const lastReadAtIso = readState.last_read_at.toISOString();

  void publish(
    chatChannel(caseId),
    buildChatReadMessage(caseId, userId, lastReadAtIso, lastReadMessageId),
  ).catch((err) => {
    logger.error({ caseId, userId, err }, "chat:read publish unexpected failure");
  });

  return {
    success: true,
    unread_count: 0,
    last_read_at: lastReadAtIso,
  };
}
