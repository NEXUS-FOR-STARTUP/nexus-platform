import { prisma } from '../../../db.js';
import {
  ASKED_MAJORS,
  CAPS,
  PreCp1InputSchema,
  ROLE_TRACK_LABELS,
  buildSyncProposals,
  levelLabel,
  type SyncResult,
  type SyncSources,
  type TemplateKey,
} from '@repo/validation';

type IdeaSnapshot = Partial<Record<'targetCustomer' | 'problem' | 'solution' | 'mvp', unknown>>;
type TeamSnapshotMember = { roleTrack?: unknown; major?: unknown; strengths?: unknown };

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

function toIdea(snapshot: unknown): SyncSources['idea'] {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const s = snapshot as IdeaSnapshot;
  return {
    targetCustomer: asText(s.targetCustomer),
    problem: asText(s.problem),
    solution: asText(s.solution),
    mvp: asText(s.mvp),
  };
}

function toTeam(snapshot: unknown): SyncSources['team'] {
  if (!Array.isArray(snapshot)) return null;
  return (snapshot as TeamSnapshotMember[]).map((m) => {
    const role = asText(m.roleTrack) as keyof typeof ROLE_TRACK_LABELS;
    return {
      roleLabel: ROLE_TRACK_LABELS[role] ?? asText(m.roleTrack),
      major: asText(m.major),
      strengths: Array.isArray(m.strengths) ? m.strengths.map(asText).filter(Boolean) : [],
    };
  });
}

const CAP_LABELS = new Map(CAPS.map((cap) => [cap.id, cap.label.split(',')[0]!.toLowerCase()]));

/**
 * pre-CP1 stores what the user typed, not team-fit's shape, so it is parsed with
 * the same schema the browser used. An unreadable snapshot yields no prefill
 * rather than a guessed one.
 */
function toPreCp1(snapshot: unknown): SyncSources['preCp1'] {
  const parsed = PreCp1InputSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const input = parsed.data;
  const team = input.team
    .map((member, i) => {
      const name = member.name?.trim() || `Người ${i + 1}`;
      const caps = Object.entries(member.caps)
        .filter(([, level]) => Boolean(level))
        .map(([cap, level]) => `${CAP_LABELS.get(cap as (typeof CAPS)[number]['id']) ?? cap} (${levelLabel(level as number).toLowerCase()})`);
      if (member.unsure || caps.length === 0) return `${name} — chưa rõ làm được gì`;
      // "Ngành khác" only says the list had no match; the typed name is the real major.
      const major = ASKED_MAJORS.includes(member.major) ? member.majorOther?.trim() || member.major : member.major;
      return `${name} — ${major} — ${caps.join(', ')}`;
    })
    .join('\n');
  const idea = input.idea?.trim() || Object.values(input.madlibs ?? {}).filter((v) => v.trim()).join('. ');
  return { team, pain: input.pain?.trim() ?? '', idea };
}

/**
 * Reads only server-persisted data: Case.team_name (project name), the saved
 * Team-Fit report, the saved pre-CP1 result and saved answers. Browser drafts
 * never reach the server.
 */
export async function getSyncProposalsUseCase(
  caseId: string,
  templateKey: TemplateKey,
): Promise<SyncResult> {
  const [caseRow, report, preCp1, answerRows] = await Promise.all([
    prisma.case.findUnique({ where: { id: caseId }, select: { team_name: true } }),
    prisma.teamFitReport.findUnique({
      where: { case_id: caseId },
      select: { idea_snapshot: true, team_snapshot: true },
    }),
    prisma.preCp1Report.findFirst({
      where: { case_id: caseId },
      orderBy: { created_at: 'desc' },
      select: { input_snapshot: true },
    }),
    prisma.projectAnswer.findMany({
      where: { case_id: caseId },
      select: { question_id: true, answer_text: true },
    }),
  ]);

  const answers: Record<string, string> = {};
  for (const row of answerRows) answers[row.question_id] = row.answer_text;

  return buildSyncProposals(templateKey, {
    projectName: caseRow?.team_name ?? null,
    idea: toIdea(report?.idea_snapshot),
    team: toTeam(report?.team_snapshot),
    preCp1: toPreCp1(preCp1?.input_snapshot),
    answers,
  });
}
