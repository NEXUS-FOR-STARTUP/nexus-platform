import { findPagedCasesByRole } from "../infrastructure/persistence/case-list.repository.js";
import { parseCaseListQuery } from "./parse-case-list-query.js";

export async function listCasesUseCase(
  session: { user: { id: string; role?: string | null } },
  query: Record<string, string | undefined> = {},
) {
  const parsed = parseCaseListQuery(query);
  const { items, total } = await findPagedCasesByRole(
    session.user.id,
    session.user.role ?? "user",
    parsed,
  );
  return {
    items,
    total,
    page: parsed.page,
    limit: parsed.limit,
  };
}
