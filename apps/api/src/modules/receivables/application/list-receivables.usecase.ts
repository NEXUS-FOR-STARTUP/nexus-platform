import { ReceivableListQuerySchema, type AdminReceivableList } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { receivableInclude, toAdminReceivable } from "../infrastructure/receivables.repository.js";

const PAGE_SIZE = 20;

export async function listReceivablesUseCase(rawQuery: unknown): Promise<AdminReceivableList> {
  const parsed = ReceivableListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_QUERY", parsed.error.issues[0]?.message ?? "Bộ lọc không hợp lệ");
  }
  const { status, search, page } = parsed.data;

  const rows = await prisma.receivable.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { customer_name: { contains: search, mode: "insensitive" } },
            { customer_contact: { contains: search, mode: "insensitive" } },
            { customer_phone: { contains: search } },
            { customer_email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: receivableInclude,
    orderBy: { created_at: "desc" },
  });

  // shortcut: status is derived from payments/adjustments, so it is filtered and paged in memory;
  // fine for one operator and a few debts a day, move to SQL if this passes a few thousand rows.
  const all = rows.map((row) => toAdminReceivable(row)).filter((r) => !status || r.status === status);
  return {
    items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    page_size: PAGE_SIZE,
    total: all.length,
    total_outstanding: all.reduce((sum, r) => sum + r.outstanding, 0),
    overdue_count: all.filter((r) => r.status === "overdue").length,
  };
}
