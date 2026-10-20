import type { ChipTone } from "@/components/ui/StatusChip";
import type { DepositDisplay } from "@/lib/deposit-display";

export function proofFileName(url?: string | null): string {
  if (!url) return "Tệp minh chứng";
  try {
    const pathname = new URL(url, "https://nexus.local").pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last ? decodeURIComponent(last) : "Tệp minh chứng";
  } catch {
    return "Tệp minh chứng";
  }
}

export function isPdfProof(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf?");
}

export function toChipTone(display: DepositDisplay): ChipTone {
  switch (display.color) {
    case "green":
      return "ok";
    case "orange":
    case "yellow":
      return "warn";
    case "red":
      return "error";
    case "blue":
      return "draft";
    default:
      return "neutral";
  }
}
