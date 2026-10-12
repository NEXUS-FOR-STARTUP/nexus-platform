import { prisma } from '../../../db.js';
import {
  ROLE_TRACK_LABELS,
  buildSyncProposals,
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

/**
 * Reads only server-persisted data: Case.team_name (project name), the saved
 * Team-Fit report and saved answers. Browser drafts never reach the server.
 */
export async function getSyncProposalsUseCase(
  caseId: string,
  templateKey: TemplateKey,
): Promise<SyncResult> {
  const [caseRow, report, answerRows] = await Promise.all([
    prisma.case.findUnique({ where: { id: caseId }, select: { team_name: true } }),
    prisma.teamFitReport.findUnique({
      where: { case_id: caseId },
      select: { idea_snapshot: true, team_snapshot: true },
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
    answers,
  });
}
