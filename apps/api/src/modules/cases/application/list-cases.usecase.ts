import { isCaseContactComplete } from "@repo/validation";
import { findPagedCasesByRole } from "../infrastructure/persistence/case-list.repository.js";
import { getEffectiveContactsByCaseIds } from "../infrastructure/persistence/case.repository.js";
import { parseCaseListQuery } from "./parse-case-list-query.js";

export async function listCasesUseCase(
  session: { user: { id: string; role?: string | null } },
  query: Record<string, string | undefined> = {},
  deps: {
    findPagedCasesByRole?: typeof findPagedCasesByRole;
    getEffectiveContactsByCaseIds?: typeof getEffectiveContactsByCaseIds;
  } = {},
) {
  const parsed = parseCaseListQuery(query);
  const finder = deps.findPagedCasesByRole ?? findPagedCasesByRole;
  const { items, total } = await finder(
    session.user.id,
    session.user.role ?? "user",
    parsed,
  );
  const contacts = await (deps.getEffectiveContactsByCaseIds ?? getEffectiveContactsByCaseIds)(
    items.map((item) => item.id),
  );
  return {
    items: items.map((item) => ({
      ...item,
      contact_complete: isCaseContactComplete(contacts.get(item.id)),
    })),
    total,
    page: parsed.page,
    limit: parsed.limit,
  };
}
