import type { CaseEvent } from "@/types";

export interface DayGroup {
  dayKey: string;
  label: string;
  events: CaseEvent[];
}

export type TimelineCategory = "all" | "grade" | "pay" | "project";

const GRADE_WORD_PREFIXES = ["audit", "grad", "eval", "score", "checkpoint", "report"];

export function getEventCategory(eventType: string): "grade" | "pay" | "project" {
  // Match whole `_`-separated words: "package_upgraded" must not count as a "grade" event.
  const words = eventType.toLowerCase().split("_");
  if (words.some((w) => GRADE_WORD_PREFIXES.some((p) => w.startsWith(p)))) {
    return "grade";
  }
  const t = eventType.toLowerCase();
  if (
    t.includes("credit") ||
    t.includes("pay") ||
    t.includes("deposit") ||
    t.includes("order") ||
    t.includes("refund") ||
    t.includes("balance") ||
    t.includes("package")
  ) {
    return "pay";
  }
  return "project";
}

export type TimelineTone = "ai" | "ok" | "doc" | "flow" | "alert" | "neutral";

const ALERT_WORDS = ["failed", "cancelled", "canceled", "rejected", "vetoed", "expired", "overdue"];
const OK_WORDS = ["completed", "complete", "approved", "accepted", "verified", "confirmed", "confirm"];
const DOC_WORDS = ["document", "documents", "docx", "proposal", "answers", "uploaded"];
const FLOW_WORDS = ["submitted", "resubmitted", "submit", "resubmit", "reopen", "revision", "request", "requested", "clarification", "intake"];

/** Legacy transition codes are verbs ("T12_REJECT"), so keyword matching can't tell them from "T3_RESUBMIT_AFTER_REJECT". */
const LEGACY_TONES: Record<string, TimelineTone> = {
  T12_REJECT: "alert",
  T13_VETO: "alert",
  T15_CANCEL: "alert",
  T5_ACCEPT: "ok",
};

/** Marker colour only; the filter tabs keep using getEventCategory. Problems win over the topic. */
export function getEventTone(eventType: string): TimelineTone {
  const legacy = LEGACY_TONES[eventType];
  if (legacy) return legacy;
  const words = eventType.toLowerCase().split("_");
  const has = (list: string[]) => words.some((w) => list.includes(w));
  if (has(ALERT_WORDS)) return "alert";
  const category = getEventCategory(eventType);
  if (category === "pay") return "ok";
  if (category === "grade") return "ai";
  if (has(OK_WORDS)) return "ok";
  if (has(DOC_WORDS)) return "doc";
  if (has(FLOW_WORDS)) return "flow";
  return "neutral";
}

export const TIMELINE_TIMEZONE = "Asia/Ho_Chi_Minh";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMELINE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFmt = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIMELINE_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const formatEventTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { timeZone: TIMELINE_TIMEZONE, hour: "2-digit", minute: "2-digit" });

/** Newest day first, newest event first inside each day. */
export function groupEventsByDay(events: CaseEvent[]): DayGroup[] {
  const sorted = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const groups: DayGroup[] = [];
  for (const event of sorted) {
    const date = new Date(event.created_at);
    const dayKey = dayKeyFmt.format(date);
    const last = groups[groups.length - 1];
    if (last?.dayKey === dayKey) last.events.push(event);
    else groups.push({ dayKey, label: dayLabelFmt.format(date), events: [event] });
  }
  return groups;
}
