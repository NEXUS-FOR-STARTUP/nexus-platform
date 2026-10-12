import { parseAndMatchDocument, type ParseResult } from '../infrastructure/document-parser.js';

export async function importProposalUseCase(
  buffer: Buffer,
  filename: string,
  targetTemplateQuestions?: string[],
): Promise<ParseResult> {
  return await parseAndMatchDocument(buffer, filename, targetTemplateQuestions);
}
