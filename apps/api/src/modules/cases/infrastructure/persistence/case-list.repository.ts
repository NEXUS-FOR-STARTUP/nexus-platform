import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";
import type { ParsedCaseListQuery } from "../../application/parse-case-list-query.js";

const USER_INCLUDE = {
  assigned_supporter: true,
  package: true,
} satisfies Prisma.CaseInclude;

const SUPPORTER_INCLUDE = {
  owner: true,
  package: true,
} satisfies Prisma.CaseInclude;

const ADMIN_INCLUDE = {
  owner: true,
  assigned_supporter: true,
  package: true,
  lifecycle_units: {
    where: { unit_type: "version" },
    orderBy: { version_no: "asc" },
    take: 1,
  },
} satisfies Prisma.CaseInclude;

function visibilityWhere(userId: string, role: string): Prisma.CaseWhereInput {
  if (role === "admin") {
    return {};
  }
  if (role === "supporter") {
    return { assigned_supporter_auth_user_id: userId };
  }
  return {
    OR: [
      { owner_auth_user_id: userId },
      { members: { some: { auth_user_id: userId } } },
    ],
  };
}

function searchWhere(search: string | undefined, includeOwner: boolean): Prisma.CaseWhereInput {
  if (!search) {
    return {};
  }
  const contains = { contains: search, mode: "insensitive" as const };
  const filters: Prisma.CaseWhereInput[] = [
    { case_code: contains },
    { team_name: contains },
  ];
  if (includeOwner) {
    filters.push({ owner: { name: contains } });
  }
  return { OR: filters };
}

function viewWhere(view: ParsedCaseListQuery["view"]): Prisma.CaseWhereInput {
  if (!view || view === "crud") {
    return {};
  }
  const active: Prisma.CaseWhereInput = {
    user_facing_stage: { notIn: ["intake_pending", "intake_ready"] },
    internal_status: { in: ["triage_pending", "accepted_unassigned", "assigned"] },
  };
  if (view === "all") {
    return active;
  }
  if (view === "intake") {
    return { user_facing_stage: { in: ["intake_pending", "intake_ready"] } };
  }
  if (view === "triage") {
    return { AND: [active, { user_facing_stage: "submitted", internal_status: "triage_pending" }] };
  }
  if (view === "unassigned") {
    return { AND: [active, { internal_status: "accepted_unassigned" }] };
  }
  if (view === "assigned") {
    return { AND: [active, { internal_status: "assigned" }] };
  }
  return active;
}

function buildWhere(
  base: Prisma.CaseWhereInput,
  query: ParsedCaseListQuery,
  includeOwnerSearch: boolean,
): Prisma.CaseWhereInput {
  const parts: Prisma.CaseWhereInput[] = [base, searchWhere(query.search, includeOwnerSearch)];
  if (query.internalStatuses?.length) {
    parts.push({ internal_status: { in: query.internalStatuses } });
  }
  if (query.stage) {
    parts.push({ user_facing_stage: query.stage });
  }
  if (query.view) {
    parts.push(viewWhere(query.view));
  }
  return { AND: parts };
}

function orderBy(query: ParsedCaseListQuery): Prisma.CaseOrderByWithRelationInput[] {
  return [{ [query.sortBy]: query.sortOrder }, { id: query.sortOrder }];
}

export async function findPagedCasesByRole(
  userId: string,
  role: string,
  query: ParsedCaseListQuery,
) {
  const include = role === "supporter" ? SUPPORTER_INCLUDE : USER_INCLUDE;
  const where = buildWhere(visibilityWhere(userId, role), query, false);
  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      include,
      orderBy: orderBy(query),
      skip: query.offset,
      take: query.limit,
    }),
    prisma.case.count({ where }),
  ]);
  return { items, total };
}

export async function findPagedCasesAdmin(query: ParsedCaseListQuery) {
  const where = buildWhere({}, query, true);
  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      include: ADMIN_INCLUDE,
      orderBy: orderBy(query),
      skip: query.offset,
      take: query.limit,
    }),
    prisma.case.count({ where }),
  ]);
  return { items, total };
}

export async function findCasesExportPage(offset: number, take: number) {
  return prisma.case.findMany({
    select: {
      id: true,
      case_code: true,
      team_name: true,
      school: true,
      user_facing_stage: true,
      internal_status: true,
      payment_status: true,
      created_at: true,
      deadline: true,
      sla_deadline_at: true,
      owner: { select: { name: true } },
      package: { select: { name: true } },
      assigned_supporter: { select: { name: true } },
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    skip: offset,
    take,
  });
}

export async function countCasesExport(): Promise<number> {
  return prisma.case.count();
}
