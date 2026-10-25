import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mammoth from 'mammoth';
import { generateGuidedDocumentDocx } from '../../../modules/guided-documents/infrastructure/docx-generator.js';
import { extractTextFromBuffer, parseAndMatchDocument } from '../../../modules/guided-documents/infrastructure/document-parser.js';

test('Guided Documents — generates valid docx buffer from answers', async () => {
  const buffer = await generateGuidedDocumentDocx({
    templateKey: 'cp1',
    caseTitle: 'Nexus EduTech',
    answersMap: {
      cp1_team_name: 'Nexus Team',
      cp1_idea_name: 'Nền tảng hướng dẫn viết tài liệu khởi nghiệp',
    },
  });

  assert.ok(Buffer.isBuffer(buffer), 'Output must be a Buffer');
  assert.ok(buffer.length > 1000, 'DOCX buffer must be non-empty');
  // Check ZIP/DOCX header (PK\x03\x04)
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4b);
});

test('Guided Documents — preserves single newlines in answers', async () => {
  const buffer = await generateGuidedDocumentDocx({
    templateKey: 'cp1',
    caseTitle: 'Nexus EduTech',
    answersMap: {
      cp1_team_name: 'Dòng 1\nDòng 2',
      cp1_idea_name: 'Đoạn 1\r\n\r\nĐoạn 2',
    },
  });

  const { value: html } = await mammoth.convertToHtml({ buffer });
  const extracted = await extractTextFromBuffer(buffer, 'guided.docx');

  assert.match(html, /<p>Dòng 1<br \/>Dòng 2<\/p>/);
  assert.match(html, /<p>Đoạn 1<\/p><p>Đoạn 2<\/p>/);
  assert.match(extracted, /Dòng 1\nDòng 2/);
  assert.match(extracted, /Đoạn 1\n\nĐoạn 2/);
});

test('Guided Documents — marks supplemental questions as TUỲ CHỌN and keeps required blanks distinct', async () => {
  const buffer = await generateGuidedDocumentDocx({
    templateKey: 'cp4',
    caseTitle: 'Nexus EduTech',
    answersMap: {},
  });
  const { value: text } = await mammoth.extractRawText({ buffer });

  assert.match(text, /Nhóm có nguồn vốn nào.*\(TUỲ CHỌN\)|\(TUỲ CHỌN\)/);
  assert.match(text, /\[TUỲ CHỌN: nhóm không trả lời\]/);
  assert.match(text, /\[Chưa có nội dung trả lời\]/);
  const optionalBlanks = text.match(/\[TUỲ CHỌN: nhóm không trả lời\]/g) ?? [];
  const requiredBlanks = text.match(/\[Chưa có nội dung trả lời\]/g) ?? [];
  assert.equal(optionalBlanks.length, 5, 'cp4 has 5 supplemental questions');
  assert.equal(requiredBlanks.length, 5, 'cp4 has 5 required questions');
});

test('Guided Documents — prints the chosen track as its label, and free text under Khác verbatim', async () => {
  const chosen = await generateGuidedDocumentDocx({
    templateKey: 'cp4',
    caseTitle: 'Nexus EduTech',
    answersMap: { cp4_fund_track: JSON.stringify({ value: 'scalable', otherText: null }) },
  });
  const { value: chosenText } = await mammoth.extractRawText({ buffer: chosen });
  assert.match(chosenText, /Phát triển nhanh \(Scalable\)/);
  assert.doesNotMatch(chosenText, /"value"/);

  const other = await generateGuidedDocumentDocx({
    templateKey: 'cp4',
    caseTitle: 'Nexus EduTech',
    answersMap: { cp4_fund_track: JSON.stringify({ value: 'other', otherText: 'Hợp tác xã nông sản' }) },
  });
  const { value: otherText } = await mammoth.extractRawText({ buffer: other });
  assert.match(otherText, /Hợp tác xã nông sản/);
});

test('Guided Documents — extracts text and matches questions from text/md buffer', async () => {
  const sampleDoc = `
Dự án: Nền tảng học nhóm

Tên nhóm của bạn là gì?
Nhóm chúng tôi là Nexus Team.

Tên ý tưởng / sản phẩm của nhóm là gì?
Nền tảng đặt chỗ học nhóm cho sinh viên đại học.
  `.trim();

  const buffer = Buffer.from(sampleDoc, 'utf-8');
  const result = await parseAndMatchDocument(buffer, 'notes.md');

  assert.ok(result.raw_text.includes('Nexus Team'));
  assert.ok(Array.isArray(result.proposals));
  const teamNameProp = result.proposals.find((p) => p.question_id === 'cp1_team_name');
  assert.ok(teamNameProp, 'Should propose answer for cp1_team_name');
  assert.ok(teamNameProp.proposed_text.length > 0);
});
