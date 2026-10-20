import { prisma } from '../../../db.js';
import { recordCaseEvent } from '../../cases/infrastructure/persistence/case-event.repository.js';
import { parseAndMatchDocument, type ParseResult } from '../infrastructure/document-parser.js';

export interface ImportProposalActor {
  caseId: string;
  userId: string;
}

export async function importProposalUseCase(
  buffer: Buffer,
  filename: string,
  actor: ImportProposalActor,
  targetTemplateQuestions?: string[],
): Promise<ParseResult> {
  const result = await parseAndMatchDocument(buffer, filename, targetTemplateQuestions);
  await recordCaseEvent(prisma, {
    caseId: actor.caseId,
    eventType: 'guided_proposal_imported',
    actorUserId: actor.userId,
    metadata: { file_name: filename },
  });
  return result;
}
