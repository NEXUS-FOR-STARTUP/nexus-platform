import { findPagedCasesAdmin } from "../../cases/infrastructure/persistence/case-list.repository.js";
import { parseCaseListQuery } from "../../cases/application/parse-case-list-query.js";

const hasText = (value: unknown, minLength = 1) => {
  return typeof value === "string" && value.trim().length >= minLength;
};

function completenessFromIntake(contentRaw: string | null | undefined): number {
  if (!contentRaw) {
    return 0;
  }
  try {
    const content = JSON.parse(contentRaw);
    const hasLegacyContext =
      hasText(content.case_summary, 20) ||
      (Array.isArray(content.current_situations) &&
        content.current_situations.some((entry: unknown) => hasText(entry, 1)));
    const checks = [
      hasText(content.contact?.full_name, 2) && hasText(content.contact?.email, 1),
      hasText(content.support_needs?.primary_need, 5),
      hasText(content.current_blocker, 10) || hasLegacyContext,
      Array.isArray(content.documents) && content.documents.length > 0,
      Array.isArray(content.boundary_confirmations) && content.boundary_confirmations.length > 0,
    ];
    return checks.filter(Boolean).length * 20;
  } catch {
    return 0;
  }
}

export async function listAdminCasesUseCase(query: Record<string, string | undefined>) {
  const parsed = parseCaseListQuery(query, { admin: true });
  const { items, total } = await findPagedCasesAdmin(parsed);

  return {
    items: items.map((item) => ({
      id: item.id,
      case_code: item.case_code,
      team_name: item.team_name,
      created_at: item.created_at,
      deadline: item.deadline,
      user_facing_stage: item.user_facing_stage,
      internal_status: item.internal_status,
      payment_status: item.payment_status,
      package_name: item.package?.name || "N/A",
      completeness: completenessFromIntake(item.lifecycle_units?.[0]?.content),
      owner_name: item.owner?.name || "N/A",
      assigned_supporter: item.assigned_supporter
        ? { id: item.assigned_supporter.id, name: item.assigned_supporter.name }
        : null,
      sla_deadline_at: item.sla_deadline_at,
    })),
    total,
    page: parsed.page,
    limit: parsed.limit,
  };
}
