import { AppError } from "../../../shared/domain/app-error.js";
import { ADMIN_EXPORT_RESOURCES, type AdminExportResource } from "@repo/validation";
import {
  countCasesExport,
  findCasesExportPage,
} from "../../cases/infrastructure/persistence/case-list.repository.js";
import {
  countDepositsExport,
  findDepositsExportPage,
} from "../../deposits/infrastructure/persistence/deposit.repository.js";
import {
  countOrdersExport,
  findOrdersExportPage,
} from "../../orders/infrastructure/persistence/order.repository.js";
import {
  countTransactionsExport,
  findTransactionsExportPage,
} from "../../wallet/infrastructure/persistence/wallet.repository.js";
import { serializeCsvRow } from "./csv-serialize.js";
import logger from "../../../shared/infrastructure/logger.js";

export const EXPORT_BATCH_SIZE = 500;
export const EXPORT_MAX_ROWS = 10_000;

const HEADERS: Record<AdminExportResource, string[]> = {
  cases: [
    "id",
    "case_code",
    "team_name",
    "school",
    "owner_name",
    "package_name",
    "user_facing_stage",
    "internal_status",
    "payment_status",
    "assigned_supporter_name",
    "created_at",
    "deadline",
    "sla_deadline_at",
  ],
  deposits: [
    "id",
    "user_id",
    "user_name",
    "user_email",
    "amount",
    "currency",
    "transfer_content",
    "status",
    "rejection_reason",
    "bank_transaction_id",
    "bank_credited_at",
    "verified_by",
    "verification_source",
    "created_at",
    "updated_at",
  ],
  transactions: [
    "id",
    "wallet_id",
    "user_id",
    "user_email",
    "type",
    "amount",
    "currency",
    "balance_before",
    "balance_after",
    "source_type",
    "source_id",
    "reference_type",
    "reference_id",
    "created_at",
  ],
  orders: [
    "id",
    "user_id",
    "user_name",
    "user_email",
    "total_amount",
    "currency",
    "status",
    "wallet_transaction_id",
    "item_service_types",
    "created_at",
    "updated_at",
  ],
};

function iso(value: Date | null | undefined): string {
  return value ? value.toISOString() : "";
}

function mapRow(resource: AdminExportResource, row: Record<string, unknown>): unknown[] {
  if (resource === "cases") {
    const owner = row.owner as { name?: string } | null;
    const pkg = row.package as { name?: string } | null;
    const supporter = row.assigned_supporter as { name?: string } | null;
    return [
      row.id,
      row.case_code,
      row.team_name,
      row.school,
      owner?.name ?? "",
      pkg?.name ?? "",
      row.user_facing_stage,
      row.internal_status,
      row.payment_status,
      supporter?.name ?? "",
      iso(row.created_at as Date),
      iso(row.deadline as Date | null),
      iso(row.sla_deadline_at as Date | null),
    ];
  }
  if (resource === "deposits") {
    const user = row.user as { name?: string; email?: string } | null;
    return [
      row.id,
      row.user_id,
      user?.name ?? "",
      user?.email ?? "",
      row.amount,
      row.currency,
      row.transfer_content,
      row.status,
      row.rejection_reason,
      row.bank_transaction_id,
      iso(row.bank_credited_at as Date | null),
      row.verified_by,
      row.verification_source,
      iso(row.created_at as Date),
      iso(row.updated_at as Date),
    ];
  }
  if (resource === "transactions") {
    const wallet = row.wallet as { user_id?: string; user?: { email?: string } } | null;
    return [
      row.id,
      row.wallet_id,
      wallet?.user_id ?? "",
      wallet?.user?.email ?? "",
      row.type,
      row.amount,
      row.currency,
      row.balance_before,
      row.balance_after,
      row.source_type,
      row.source_id,
      row.reference_type,
      row.reference_id,
      iso(row.created_at as Date),
    ];
  }
  const user = row.user as { name?: string; email?: string } | null;
  const items = (row.items as Array<{ service_type: string; quantity: number }> | undefined) ?? [];
  return [
    row.id,
    row.user_id,
    user?.name ?? "",
    user?.email ?? "",
    row.total_amount,
    row.currency,
    row.status,
    row.wallet_transaction_id,
    items.map((item) => `${item.service_type} x${item.quantity}`).join("; "),
    iso(row.created_at as Date),
    iso(row.updated_at as Date),
  ];
}

async function countResource(resource: AdminExportResource): Promise<number> {
  if (resource === "cases") return countCasesExport();
  if (resource === "deposits") return countDepositsExport();
  if (resource === "transactions") return countTransactionsExport();
  return countOrdersExport();
}

async function fetchPage(resource: AdminExportResource, offset: number, take: number) {
  if (resource === "cases") return findCasesExportPage(offset, take);
  if (resource === "deposits") return findDepositsExportPage(offset, take);
  if (resource === "transactions") return findTransactionsExportPage(offset, take);
  return findOrdersExportPage(offset, take);
}

export function parseExportResource(raw: string | undefined): AdminExportResource {
  if (!raw || !(ADMIN_EXPORT_RESOURCES as readonly string[]).includes(raw)) {
    throw new AppError(400, "VALIDATION_ERROR", "resource không hợp lệ");
  }
  return raw as AdminExportResource;
}

export async function exportAdminDataUseCase(resource: AdminExportResource): Promise<{
  csv: string;
  filename: string;
}> {
  const total = await countResource(resource);
  if (total > EXPORT_MAX_ROWS) {
    throw new AppError(
      400,
      "EXPORT_TOO_LARGE",
      `Quá ${EXPORT_MAX_ROWS} dòng. Thu hẹp dữ liệu trước khi xuất.`,
    );
  }

  const headers = HEADERS[resource];
  let csv = `\uFEFF${serializeCsvRow(headers)}`;
  let offset = 0;
  while (offset < total) {
    const page = await fetchPage(resource, offset, EXPORT_BATCH_SIZE);
    if (page.length === 0) {
      break;
    }
    for (const row of page) {
      csv += serializeCsvRow(mapRow(resource, row as Record<string, unknown>));
    }
    offset += page.length;
    if (page.length < EXPORT_BATCH_SIZE) {
      break;
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  logger.info({ resource, total }, "admin export generated");
  return {
    csv,
    filename: `nexus-${resource}-${date}.csv`,
  };
}
