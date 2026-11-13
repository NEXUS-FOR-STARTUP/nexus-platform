import {
  CAPS,
  LEVELS,
  PreCp1InputSchema,
  ROLE_TRACK_LABELS,
  type PreCp1Input,
} from "@repo/validation";
import type { PreCp1ReportRecord } from "@/types";
import type { TeamMemberSnapshot } from "./caseOverviewData";

export interface PreCp1OverviewFallback {
  schoolLabel: string;
  courseLabel: string;
  projectName: string;
  field: string;
  targetCustomer: string;
  problem: string;
  solution: string;
  mvp: string;
  members: TeamMemberSnapshot[];
}

function mapPreCp1Members(input: PreCp1Input): TeamMemberSnapshot[] {
  return input.team.map((m) => {
    const major =
      m.major === "Ngành khác"
        ? m.majorOther?.trim() || "Ngành khác"
        : m.major;
    const role = m.roleTrackHint ? ROLE_TRACK_LABELS[m.roleTrackHint] : undefined;
    const capParts = CAPS.flatMap((cap) => {
      const level = m.caps[cap.id];
      if (!level) return [];
      const lvlLabel = LEVELS.find((l) => l.v === level)?.label ?? String(level);
      return [`${cap.label} (${lvlLabel})`];
    });
    if (m.unsure) capParts.push("Chưa rõ thế mạnh");
    if (m.extra?.trim()) capParts.push(m.extra.trim());

    return {
      name: m.name?.trim() || undefined,
      major,
      role,
      skills: capParts.join("; ") || undefined,
    };
  });
}

export function derivePreCp1Overview(record?: PreCp1ReportRecord | null): PreCp1OverviewFallback | null {
  if (!record) return null;
  const parsed = PreCp1InputSchema.safeParse(record.input_snapshot);
  if (!parsed.success) return null;
  const input = parsed.data;

  return {
    schoolLabel: input.school === "fpt" ? "Đại học FPT" : input.schoolName?.trim() || "Trường khác",
    courseLabel: input.course === "exe101" ? "EXE101" : input.courseName?.trim() || "Môn học khác",
    projectName: input.madlibs?.projectName?.trim() || "",
    field: input.madlibs?.field?.trim() || "",
    targetCustomer: input.madlibs?.targetCustomer?.trim() || "",
    problem: input.madlibs?.problem?.trim() || "",
    solution: input.madlibs?.solution?.trim() || "",
    mvp: input.madlibs?.mvp?.trim() || "",
    members: mapPreCp1Members(input),
  };
}
