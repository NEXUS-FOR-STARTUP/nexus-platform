import { AppError } from "../../../shared/domain/app-error.js";
import {
  ADMIN_CASE_LIST_VIEWS,
  CASE_LIST_DEFAULT_LIMIT,
  CASE_LIST_MAX_LIMIT,
  CASE_LIST_SORT_FIELDS,
  type AdminCaseListView,
  type CaseListSortField,
} from "@repo/validation";
import {
  isValidAdminCaseStage,
  isValidAdminInternalStatus,
} from "../../admin/domain/admin.types.js";

const INTAKE_STAGES = ["intake_pending", "intake_ready"] as const;

export interface ParsedCaseListQuery {
  page: number;
  offset: number;
  limit: number;
  search?: string;
  sortBy: CaseListSortField;
  sortOrder: "asc" | "desc";
  internalStatuses?: string[];
  stage?: string;
  view?: AdminCaseListView;
}

function parseIntParam(
  raw: string | undefined,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw === "") {
    return fallback;
  }
  if (!/^\d+$/.test(raw)) {
    throw new AppError(400, "VALIDATION_ERROR", `${name} không hợp lệ`);
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(400, "VALIDATION_ERROR", `${name} không hợp lệ`);
  }
  return value;
}

function parseInternalStatuses(raw: string | undefined): string[] | undefined {
  if (!raw || !raw.trim()) {
    return undefined;
  }
  const values = raw.split(",").map((item) => item.trim()).filter(Boolean);
  if (values.length === 0) {
    return undefined;
  }
  for (const value of values) {
    if (!isValidAdminInternalStatus(value)) {
      throw new AppError(400, "VALIDATION_ERROR", "internal_status không hợp lệ");
    }
  }
  return values;
}

function parseStage(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) {
    return undefined;
  }
  const stage = raw.trim();
  const allowed =
    isValidAdminCaseStage(stage) ||
    (INTAKE_STAGES as readonly string[]).includes(stage);
  if (!allowed) {
    throw new AppError(400, "VALIDATION_ERROR", "stage không hợp lệ");
  }
  return stage;
}

export function parseCaseListQuery(
  query: Record<string, string | undefined>,
  options: { admin?: boolean } = {},
): ParsedCaseListQuery {
  const page = parseIntParam(query.page, "page", 1, 1, 500);
  const limit = parseIntParam(
    query.limit,
    "limit",
    CASE_LIST_DEFAULT_LIMIT,
    1,
    CASE_LIST_MAX_LIMIT,
  );
  const offset = (page - 1) * limit;

  const sortByRaw = query.sortBy || "created_at";
  if (!(CASE_LIST_SORT_FIELDS as readonly string[]).includes(sortByRaw)) {
    throw new AppError(400, "VALIDATION_ERROR", "sortBy không hợp lệ");
  }

  const sortOrderRaw = query.sortOrder || "desc";
  if (sortOrderRaw !== "asc" && sortOrderRaw !== "desc") {
    throw new AppError(400, "VALIDATION_ERROR", "sortOrder không hợp lệ");
  }

  const search = query.search?.trim();
  if (search && search.length > 200) {
    throw new AppError(400, "VALIDATION_ERROR", "search không hợp lệ");
  }

  const parsed: ParsedCaseListQuery = {
    page,
    offset,
    limit,
    search: search || undefined,
    sortBy: sortByRaw as CaseListSortField,
    sortOrder: sortOrderRaw,
    internalStatuses: parseInternalStatuses(query.internal_status),
    stage: parseStage(query.stage),
  };

  if (!options.admin) {
    return parsed;
  }

  if (query.view) {
    if (!(ADMIN_CASE_LIST_VIEWS as readonly string[]).includes(query.view)) {
      throw new AppError(400, "VALIDATION_ERROR", "view không hợp lệ");
    }
    parsed.view = query.view as AdminCaseListView;
  }

  return parsed;
}

export const SUPPORTER_STATUS_GROUPS = {
  pending: ["assigned", "supporter_working", "waiting_user"],
  submitted: ["report_ready_to_publish"],
  completed: ["done"],
} as const;
