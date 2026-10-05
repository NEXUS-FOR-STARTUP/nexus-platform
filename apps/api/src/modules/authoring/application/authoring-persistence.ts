import { prisma } from "../../../db.js";
import type { AnswerStateMap } from "../domain/authoring-domain.js";

// ---------------------------------------------------------------------------
// Shared persistence helpers for the authoring application services. Kept free
// of business logic so each service stays focused and under the file-size limit.
// ---------------------------------------------------------------------------

type AnswerRow = {
  question_id: string;
  status: string;
  needs_review: boolean;
};

export function loadAnswerRows(caseId: string) {
  return prisma.projectAnswer.findMany({
    where: { case_id: caseId },
    select: { question_id: true, status: true, needs_review: true },
  });
}

export function toAnswerStateMap(rows: AnswerRow[]): AnswerStateMap {
  const map: AnswerStateMap = {};
  for (const row of rows) {
    map[row.question_id] = {
      status: row.status === "complete" ? "complete" : "draft",
      needs_review: row.needs_review,
    };
  }
  return map;
}

export function importExtensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
}

/** Resolve the checkpoint a generated `gNN` unit / imported source doc belongs to. */
export async function resolveAuthoringCheckpointId(caseId: string): Promise<string | null> {
  const caseRow = await prisma.case.findUnique({
    where: { id: caseId },
    select: { current_checkpoint: true },
  });
  if (caseRow?.current_checkpoint) {
    const cp = await prisma.checkpoint.findFirst({
      where: { case_id: caseId, checkpoint_code: caseRow.current_checkpoint },
    });
    if (cp) return cp.id;
  }
  const latest = await prisma.checkpoint.findFirst({
    where: { case_id: caseId },
    orderBy: { latest_version_no: "desc" },
  });
  return latest?.id ?? null;
}
