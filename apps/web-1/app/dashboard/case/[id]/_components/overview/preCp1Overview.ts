import {
  ASSET_PROMPTS,
  ASSET_RULES,
  BUDGETS,
  CAPS,
  GOALS,
  IDEA_RULES,
  LEVELS,
  NET_OPTIONS,
  PreCp1InputSchema,
  ROLE_TRACK_LABELS,
  SENSITIVE,
  type LabelQuote,
  type PreCp1Input,
  type PreCp1Report,
} from "@repo/validation";
import type { PreCp1ReportRecord } from "@/types";
import type { TeamMemberSnapshot } from "./caseOverviewData";

export interface PreCp1Overview {
  schoolLabel: string;
  courseLabel: string;
  goalLabel: string;
  budgetLabel: string;
  ideaModeLabel: string;
  projectName: string;
  field: string;
  targetCustomer: string;
  problem: string;
  solution: string;
  mvp: string;
  pain: string;
  idea: string;
  members: TeamMemberSnapshot[];
  assets: Array<readonly [label: string, value: string]>;
  assetTags: string[];
  network: string[];
  sensitive: string[];
  ideaTags: string[];
  aiLabels: string[];
  verdict: { title: string; detail: string } | null;
  flags: Array<{ title: string; reason: string; fix: string }>;
  recruit: Array<{ title: string; why: string }>;
}

const IDEA_MODE_LABELS: Record<PreCp1Input["ideaMode"], string> = {
  none: "Chưa có ý tưởng cụ thể",
  draft: "Có hướng sơ bộ / vấn đề đang quan tâm",
  structured: "Đã có ý tưởng cụ thể (6 mục)",
};

function labelFrom<T extends { id: string }>(
  list: readonly T[],
  id: string,
  pick: (item: T) => string,
): string {
  const found = list.find((item) => item.id === id);
  return found ? pick(found) : id;
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

function asReport(value: unknown): PreCp1Report | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<PreCp1Report>;
  if (!r.verdict || !Array.isArray(r.flags)) return null;
  return r as PreCp1Report;
}

export function derivePreCp1Overview(record?: PreCp1ReportRecord | null): PreCp1Overview | null {
  if (!record) return null;
  const parsed = PreCp1InputSchema.safeParse(record.input_snapshot);
  if (!parsed.success) return null;
  const input = parsed.data;
  const report = asReport(record.report_snapshot);

  const assets: Array<readonly [string, string]> = [];
  for (const prompt of ASSET_PROMPTS) {
    const ans = input.assets[prompt.id]?.trim();
    if (ans) assets.push([prompt.title, ans]);
  }
  if (input.assetsOther?.trim()) {
    assets.push(["Tài nguyên khác", input.assetsOther.trim()]);
  }

  const network = input.network.map((id) => labelFrom(NET_OPTIONS, id, (x) => x.label));
  if (input.networkOther?.trim()) network.push(input.networkOther.trim());

  const aiLabels = Array.isArray(record.ai_labels)
    ? (record.ai_labels as LabelQuote[]).map((l) => l.quote).filter(Boolean)
    : [];

  return {
    schoolLabel: input.school === "fpt" ? "Đại học FPT" : input.schoolName?.trim() || "Trường khác",
    courseLabel: input.course === "exe101" ? "EXE101" : input.courseName?.trim() || "Môn học khác",
    goalLabel: labelFrom(GOALS, input.goal, (x) => x.title),
    budgetLabel: labelFrom(BUDGETS, input.budget, (x) => x.title),
    ideaModeLabel: IDEA_MODE_LABELS[input.ideaMode],
    projectName: input.madlibs?.projectName?.trim() || "",
    field: input.madlibs?.field?.trim() || "",
    targetCustomer: input.madlibs?.targetCustomer?.trim() || "",
    problem: input.madlibs?.problem?.trim() || "",
    solution: input.madlibs?.solution?.trim() || "",
    mvp: input.madlibs?.mvp?.trim() || "",
    pain: input.pain?.trim() || "",
    idea: input.idea?.trim() || "",
    members: mapPreCp1Members(input),
    assets,
    assetTags: ASSET_RULES.filter((r) => input.assetTags[r.id] === "yes").map((r) => r.label),
    network,
    sensitive: input.sensitive.map((id) => labelFrom(SENSITIVE, id, (x) => x.label)),
    ideaTags: IDEA_RULES.filter((r) => input.ideaTags[r.id] === "yes").map((r) => r.label),
    aiLabels,
    verdict: report ? { title: report.verdict.title, detail: report.verdict.detail } : null,
    flags: report
      ? report.flags
          .filter((f) => f.status !== "ok")
          .map((f) => ({ title: f.title, reason: f.reason, fix: f.fix }))
      : [],
    recruit: report?.recruit?.map((r) => ({ title: r.title, why: r.why })) ?? [],
  };
}
