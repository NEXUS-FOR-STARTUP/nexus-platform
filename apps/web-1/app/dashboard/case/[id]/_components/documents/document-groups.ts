import { DOCUMENT_CATEGORY_CODES } from "@repo/validation";
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
    const label = row.contextLabel || "Tài liệu";
    const key = row.categoryKey ?? `type:${label}`;
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(key, { key, label, rows: [row] });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const firstA = a.rows[0];
    const firstB = b.rows[0];
    const orderA = firstA?.categoryKey
      ? (categoryOrder.get(firstA.categoryKey) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    const orderB = firstB?.categoryKey
      ? (categoryOrder.get(firstB.categoryKey) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.label.localeCompare(b.label);
  });
}
