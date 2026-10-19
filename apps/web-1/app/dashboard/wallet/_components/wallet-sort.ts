import type { SortField, SortOrder, SortState } from "./wallet-transaction.types";

export interface SortOption {
  value: string;
  label: string;
  field: SortField;
  order: SortOrder;
}

export const WALLET_SORT_OPTIONS: SortOption[] = [
  { value: "created_at:desc", label: "Mới nhất", field: "created_at", order: "desc" },
  { value: "created_at:asc", label: "Cũ nhất", field: "created_at", order: "asc" },
  { value: "amount:desc", label: "Số tiền cao nhất", field: "amount", order: "desc" },
  { value: "amount:asc", label: "Số tiền thấp nhất", field: "amount", order: "asc" },
];

export function parseSortValue(val?: string | null): SortState {
  const matched = WALLET_SORT_OPTIONS.find((opt) => opt.value === val);
  if (matched) {
    return { field: matched.field, order: matched.order };
  }
  return { field: "created_at", order: "desc" };
}

export function toSortValue(sort: SortState): string {
  return `${sort.field}:${sort.order}`;
}
