import type { ChipTone } from "@/components/ui/StatusChip";
import type { WalletTransactionItem } from "./wallet-transaction.types";
import { TYPE_LABELS } from "./wallet-transaction.types";

/** Strips server-appended amount suffix like ` (+100,000 VND)` or ` (-79.000 VND)`. */
export function cleanDescription(raw?: string | null): string {
  if (!raw) return "";
  return raw.replace(/\s*\([+-]?[\d.,]+\s*VND\)\s*$/i, "").trim();
}

export interface WalletRowDescriptor {
  title: string;
  subtitle: string;
  typeTone: ChipTone;
  typeLabel: string;
  canOpenDeposit: boolean;
  canOpenOrder: boolean;
}

export function describeWalletRow(tx: WalletTransactionItem): WalletRowDescriptor {
  const typeLabel = TYPE_LABELS[tx.type] || tx.type || "Giao dịch";
  const cleaned = cleanDescription(tx.source_description);
  const title = cleaned || typeLabel;

  let subtitle = "";
  if (cleaned && cleaned !== typeLabel) {
    subtitle = typeLabel;
  } else if (tx.source_type) {
    subtitle = `Nguồn: ${tx.source_type}`;
  }

  let typeTone: ChipTone = "neutral";
  if (tx.type === "deposit") {
    typeTone = "ok";
  } else if (tx.type === "withdrawal") {
    typeTone = "error";
  } else if (tx.type === "refund") {
    typeTone = "draft";
  } else if (tx.type === "service_payment" || tx.type === "adjustment" || tx.type === "migration") {
    typeTone = "warn";
  }

  const canOpenDeposit = tx.type === "deposit" && tx.source_type === "deposit" && Boolean(tx.source_id);
  const canOpenOrder = tx.source_type === "order" && Boolean(tx.source_id);

  return {
    title,
    subtitle,
    typeTone,
    typeLabel,
    canOpenDeposit,
    canOpenOrder,
  };
}
