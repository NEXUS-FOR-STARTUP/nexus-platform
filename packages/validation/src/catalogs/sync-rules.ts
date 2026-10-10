// ---------------------------------------------------------------------------
// Sync rules — which already-saved data pre-fills which template question.
// Only data officially stored on the server is used (Case.team_name, the saved
// Team-Fit report, saved ProjectAnswer rows). Browser-only drafts are never read.
// A rule lists sources in priority order; the first non-empty source wins.
// Adding a rule = one line in SYNC_RULES; adding a source kind = one case in `read`.
// ---------------------------------------------------------------------------

export type IdeaField = "targetCustomer" | "problem" | "solution" | "mvp";

export type SyncSource =
  | { kind: "project_name" }
  | { kind: "idea"; field: IdeaField }
  | { kind: "team" }
  | { kind: "answer"; question_id: string };

export interface SyncRule {
  target: string;
  from: SyncSource[];
}

/** Server-side data a sync run reads from. `answers` holds saved answers only. */
export interface SyncSources {
  /** Case.team_name — the project name (Team-Fit sets it, intake submission overwrites it). */
  projectName: string | null;
  idea: Record<IdeaField, string> | null;
  /** Team-Fit members with the role already mapped to its Vietnamese label. */
  team: Array<{ roleLabel: string; major: string; strengths: string[] }> | null;
  answers: Record<string, string>;
}

export interface SyncProposal {
  question_id: string;
  answer_text: string;
}

export interface SyncResult {
  proposals: SyncProposal[];
  /** Targets that had source data but were left alone because they already have an answer. */
  skipped_filled: number;
}

const ans = (question_id: string): SyncSource => ({ kind: "answer", question_id });
const idea = (field: IdeaField): SyncSource => ({ kind: "idea", field });

export const SYNC_RULES: Record<string, SyncRule[]> = {
  cp1: [
    { target: "cp1_team_name", from: [{ kind: "project_name" }] },
    { target: "cp1_team_members", from: [{ kind: "team" }] },
    { target: "cp1_idea_name", from: [{ kind: "project_name" }] },
    { target: "cp1_primary_customer", from: [idea("targetCustomer")] },
    { target: "cp1_main_problem", from: [idea("problem")] },
    { target: "cp1_solution_description", from: [idea("solution")] },
    { target: "cp1_mvp_definition", from: [idea("mvp")] },
  ],
  cp2: [
    { target: "cp2_problem_need", from: [ans("cp1_main_problem"), idea("problem")] },
    { target: "cp2_solution", from: [ans("cp1_solution_description"), idea("solution")] },
  ],
  cp3: [
    { target: "cp3_mvp_problem_pitch", from: [ans("cp2_problem_need"), ans("cp1_main_problem"), idea("problem")] },
    { target: "cp3_mvp_demo_script", from: [ans("cp2_mvp_demo")] },
    { target: "cp3_user_persona", from: [ans("cp1_customer_story")] },
    {
      target: "cp3_bmc_customer_segments",
      from: [ans("cp1_primary_customer"), idea("targetCustomer")],
    },
    { target: "cp3_bmc_revenue_streams", from: [ans("cp1_revenue_model")] },
  ],
};

function formatTeam(team: NonNullable<SyncSources["team"]>): string {
  return team
    .map((m, i) => {
      const strengths = m.strengths.length > 0 ? ` Thế mạnh: ${m.strengths.join("; ")}.` : "";
      return `Thành viên ${i + 1} — ${m.roleLabel}, ngành ${m.major}.${strengths}`;
    })
    .join("\n");
}

function read(source: SyncSource, sources: SyncSources): string {
  switch (source.kind) {
    case "project_name":
      return sources.projectName?.trim() ?? "";
    case "idea":
      return sources.idea?.[source.field]?.trim() ?? "";
    case "team":
      return sources.team && sources.team.length > 0 ? formatTeam(sources.team) : "";
    case "answer":
      return sources.answers[source.question_id]?.trim() ?? "";
  }
}

/** Pure: decides which questions of `templateKey` can be pre-filled. Never overwrites a saved answer. */
export function buildSyncProposals(templateKey: string, sources: SyncSources): SyncResult {
  const proposals: SyncProposal[] = [];
  let skipped_filled = 0;

  for (const rule of SYNC_RULES[templateKey] ?? []) {
    const value = rule.from.map((s) => read(s, sources)).find((v) => v.length > 0);
    if (!value) continue;
    if (sources.answers[rule.target]?.trim()) {
      skipped_filled += 1;
      continue;
    }
    proposals.push({ question_id: rule.target, answer_text: value });
  }

  return { proposals, skipped_filled };
}
