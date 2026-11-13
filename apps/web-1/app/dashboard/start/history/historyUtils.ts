import {
  buildPreCp1Report,
  PreCp1InputSchema,
  TeamFitFreeReportSchema,
  type PreCp1Input,
  type PreCp1Report,
  type TeamFitSavedResult,
} from "@repo/validation";
import type { PreCp1HistoryItem } from "../_hooks/usePreCp1History";

export type FilterMode = "all" | "case" | "linked" | "unlinked";

export function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseHistoryInput(raw: unknown): PreCp1Input | null {
  const res = PreCp1InputSchema.safeParse(raw);
  return res.success ? res.data : null;
}

export function parseHistoryReport(raw: unknown, input: PreCp1Input | null): PreCp1Report | null {
  if (raw && typeof raw === "object") {
    const r = raw as Partial<PreCp1Report>;
    if (r.verdict && Array.isArray(r.flags) && Array.isArray(r.zones)) {
      return r as PreCp1Report;
    }
  }
  return input ? buildPreCp1Report(input) : null;
}

export function parseHistoryAiResult(raw: unknown): TeamFitSavedResult | null {
  if (!raw) return null;
  const res = TeamFitFreeReportSchema.safeParse(raw);
  return res.success ? res.data : null;
}

export function historyItemTitle(item: PreCp1HistoryItem, input: PreCp1Input | null): string {
  const madlibName = input?.madlibs?.projectName?.trim();
  if (madlibName) return madlibName;
  if (item.case?.team_name?.trim()) return item.case.team_name.trim();
  if (input?.idea?.trim()) return input.idea.trim().slice(0, 72);
  if (input?.pain?.trim()) return input.pain.trim().slice(0, 72);
  return "Lần đánh giá chưa đặt tên";
}
