"use client";

import { Lightbulb, Users, Package, Banknote } from "lucide-react";
import type React from "react";

/**
 * Shared stage display meta (card + detail header read the same source).
 * Color per stage slug; number is the CP code zero-padded like the card ("01").
 */
export const STAGE_DISPLAY_META: Record<string, { icon: React.ElementType; color: string; lightBg: string }> = {
  "y-tuong": {
    icon: Lightbulb,
    color: "var(--mantine-color-blue-6)",
    lightBg: "var(--mantine-color-blue-0)",
  },
  "thi-truong": {
    icon: Users,
    color: "var(--mantine-color-violet-6)",
    lightBg: "var(--mantine-color-violet-0)",
  },
  "san-pham-mo-hinh": {
    icon: Package,
    color: "var(--mantine-color-orange-6)",
    lightBg: "var(--mantine-color-orange-0)",
  },
  "goi-von-tai-chinh": {
    icon: Banknote,
    color: "var(--mantine-color-teal-6)",
    lightBg: "var(--mantine-color-teal-0)",
  },
};

export function stageNumberOf(code: string): string {
  return code.replace("CP", "").padStart(2, "0");
}
