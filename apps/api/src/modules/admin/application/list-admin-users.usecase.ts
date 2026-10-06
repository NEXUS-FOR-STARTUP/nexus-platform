import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";

export interface ListAdminUsersQuery {
  search?: string;
  role?: string;
  banned?: string;
  limit?: number | string;
  offset?: number | string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export async function listAdminUsersUseCase(query: ListAdminUsersQuery = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const search = query.search?.trim();
  const role = query.role && query.role !== "all" ? query.role : undefined;
  const banned = query.banned !== undefined ? query.banned === "true" : undefined;
  const sortDirection: "asc" | "desc" = query.sortDirection === "asc" ? "asc" : "desc";
  const sortBy = query.sortBy || "createdAt";

  const conditions: Prisma.UserWhereInput[] = [
    { role: { not: "system" } },
    { email: { not: "system@nexus.internal" } },
  ];

  if (role) {
    conditions.push({ role });
  }

  if (banned !== undefined) {
    conditions.push({ banned });
  }

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.UserWhereInput = {
    AND: conditions,
  };

  let orderBy: Prisma.UserOrderByWithRelationInput;
  if (sortBy === "name") {
    orderBy = { name: sortDirection };
  } else {
    orderBy = { created_at: sortDirection };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        email_verified: true,
        image: true,
        role: true,
        banned: true,
        ban_reason: true,
        ban_expires: true,
        username: true,
        display_username: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const mappedUsers = users.map((u) => ({
    ...u,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    banReason: u.ban_reason,
  }));

  return {
    users: mappedUsers,
    total,
    limit,
    offset,
  };
}
