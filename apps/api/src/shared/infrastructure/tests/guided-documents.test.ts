import { test } from 'node:test';
import assert from 'node:assert/strict';
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
