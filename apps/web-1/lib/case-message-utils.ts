import type { CaseMessage } from "@/types";

export function compareCaseMessages(a: CaseMessage, b: CaseMessage): number {
  const byTime = a.created_at.localeCompare(b.created_at);
  if (byTime !== 0) return byTime;
  return a.id.localeCompare(b.id);
}

export function appendMessageAsc(list: CaseMessage[], message: CaseMessage): CaseMessage[] {
  return [...list, message].sort(compareCaseMessages);
}
