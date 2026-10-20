import { DOCUMENT_CATEGORY_CODES, docCategoryLabel } from "@repo/validation";
import type { DocumentRow } from "../../documents/document-workspace.types";

export interface DocumentGroup {
  label: string;
  rows: DocumentRow[];
}

const KNOWN_LABELS: string[] = DOCUMENT_CATEGORY_CODES.map((code) => docCategoryLabel(code));
const OTHER_LABEL = "Khác";
const VERSION_LABEL_PATTERN = /^v(\d+)$/;

function timeOf(row: DocumentRow): number {
  const t = new Date(row.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Groups by upload category in catalog order, empty groups dropped, unknown labels under "Khác"; newest first inside a group. */
export function groupDocumentsByCategory(rows: DocumentRow[]): DocumentGroup[] {
  const byLabel = new Map<string, DocumentRow[]>();
  for (const row of rows) {
    const label = KNOWN_LABELS.includes(row.contextLabel) ? row.contextLabel : OTHER_LABEL;
    byLabel.set(label, [...(byLabel.get(label) ?? []), row]);
  }
  return [...KNOWN_LABELS, OTHER_LABEL]
    .filter((label) => byLabel.has(label))
    .map((label) => ({ label, rows: [...(byLabel.get(label) ?? [])].sort((a, b) => timeOf(b) - timeOf(a)) }));
}

/** Catalog categories with no uploaded document yet. */
export function missingCategories(groups: DocumentGroup[]): string[] {
  const present = new Set(groups.map((g) => g.label));
  return KNOWN_LABELS.filter((label) => !present.has(label));
}

/** "v02" -> "Bản 2"; first version and non-version labels (e.g. "Đợt 1") yield null. */
export function versionChip(versionLabel: string): string | null {
  const match = VERSION_LABEL_PATTERN.exec(versionLabel);
  const n = match ? Number(match[1]) : 0;
  return n > 1 ? `Bản ${n}` : null;
}
