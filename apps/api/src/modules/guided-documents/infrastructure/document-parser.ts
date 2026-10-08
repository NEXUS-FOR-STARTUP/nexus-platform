import path from 'node:path';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { QUESTION_REGISTRY } from '@repo/validation';

export interface ParseResult {
  raw_text: string;
  proposals: Array<{
    question_id: string;
    proposed_text: string;
    confidence: number;
  }>;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (ext === '.pdf') {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return textResult.text || '';
  }

  if (ext === '.txt' || ext === '.md') {
    return buffer.toString('utf-8');
  }

  throw new Error(`Định dạng tệp ${ext} không được hỗ trợ. Vui lòng tải tệp .docx, .pdf hoặc .md`);
}

function normalizeKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export async function parseAndMatchDocument(
  buffer: Buffer,
  filename: string,
  targetTemplateQuestions?: string[],
): Promise<ParseResult> {
  const rawText = await extractTextFromBuffer(buffer, filename);
  const paragraphs = rawText
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const candidateQuestionIds = targetTemplateQuestions && targetTemplateQuestions.length > 0
    ? targetTemplateQuestions
    : Object.keys(QUESTION_REGISTRY);

  const proposals: Array<{
    question_id: string;
    proposed_text: string;
    confidence: number;
  }> = [];

  for (const qId of candidateQuestionIds) {
    const q = (QUESTION_REGISTRY as Record<string, { text: string; explanation?: string }>)[qId];
    if (!q) continue;

    const qKeywords = normalizeKeywords(q.text);
    if (qKeywords.length === 0) continue;

    let bestPara = '';
    let bestScore = 0;

    for (const para of paragraphs) {
      if (para.length < 5) continue;
      const paraKeywords = new Set(normalizeKeywords(para));

      let matched = 0;
      for (const kw of qKeywords) {
        if (paraKeywords.has(kw)) matched++;
      }

      const score = matched / qKeywords.length;
      if (score > bestScore) {
        bestScore = score;
        bestPara = para;
      }
    }

    if (bestScore >= 0.3 && bestPara) {
      proposals.push({
        question_id: qId,
        proposed_text: bestPara,
        confidence: Math.min(1, Math.round(bestScore * 100) / 100),
      });
    }
  }

  return {
    raw_text: rawText,
    proposals,
  };
}
