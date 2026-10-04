import {
  canonicalizeDocCategory,
  docCategoryLabel,
  DOCUMENT_CATEGORY_CODES,
} from "@repo/validation";
import type { DocumentRow } from "./document-workspace.types";

export interface DocumentCategoryGroup {
  key: string;
  label: string;
  rows: DocumentRow[];
}

export function buildCategoryGroups(rows: DocumentRow[]): DocumentCategoryGroup[] {
  const categoryOrder = new Map<string, number>(
    DOCUMENT_CATEGORY_CODES.map((code, index) => [code, index])
  );
  const groups = new Map<string, DocumentCategoryGroup>();

  for (const row of rows) {
    const canonicalKey = row.categoryKey ? canonicalizeDocCategory(row.categoryKey) : null;
    const key = canonicalKey ?? (row.contextLabel ? `type:${row.contextLabel}` : "type:Tài liệu");
    const label = canonicalKey ? docCategoryLabel(canonicalKey) : (row.contextLabel || "Tài liệu");
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(key, { key, label, rows: [row] });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const orderA = categoryOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER;
    const orderB = categoryOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.label.localeCompare(b.label);
  });
}
