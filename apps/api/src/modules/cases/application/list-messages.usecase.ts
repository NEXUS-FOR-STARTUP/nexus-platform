import { listCaseMessages } from "../infrastructure/persistence/case.repository.js";

type ListMessagesOptions = {
  limit?: number;
  before?: { createdAt: Date; id: string };
};

const defaultDeps = { listCaseMessages };

export async function listMessagesUseCase(
  caseId: string,
  options: ListMessagesOptions = {},
  deps: { listCaseMessages?: typeof listCaseMessages } = {},
) {
  const { listCaseMessages: repo } = { ...defaultDeps, ...deps };
  return await repo(caseId, options);
}
