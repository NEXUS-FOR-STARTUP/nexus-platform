import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { TEMPLATE_REGISTRY, QUESTION_REGISTRY, formatChoice, type Question, type Template, type TemplateKey } from '@repo/validation';

const OPTIONAL_LABEL = 'TUỲ CHỌN';
const EMPTY_REQUIRED_TEXT = '[Chưa có nội dung trả lời]';
const EMPTY_OPTIONAL_TEXT = '[TUỲ CHỌN: nhóm không trả lời]';
const OPTIONAL_BADGE_COLOR = 'C05621';

/** Nhãn viết hoa để người đọc và agent hiểu câu này có thể không có câu trả lời. */
function optionalBadge(size: number): TextRun {
  return new TextRun({ text: ` (${OPTIONAL_LABEL})`, bold: true, size, color: OPTIONAL_BADGE_COLOR });
}

export interface DocxGenerationInput {
  templateKey: TemplateKey;
  answersMap: Record<string, string>;
  caseTitle: string;
}

export async function generateGuidedDocumentDocx(
  input: DocxGenerationInput,
): Promise<Buffer> {
  const template: Template = TEMPLATE_REGISTRY[input.templateKey];
  const questionsRecord = QUESTION_REGISTRY as Record<string, Question | undefined>;

  const children: (Paragraph | Table)[] = [];

  // 1. Cover / Title Header
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: template.title.toUpperCase(),
          bold: true,
          size: 36, // 18pt
          color: '1A365D',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Dự án: ${input.caseTitle}`,
          bold: true,
          size: 24, // 12pt
          color: '4A5568',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 300 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: 'CBD5E0',
        },
      },
      children: [],
    }),
  );

  // 2. Table of Contents (Mục lục tài liệu)
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 150 },
      children: [
        new TextRun({
          text: 'MỤC LỤC TÀI LIỆU',
          bold: true,
          size: 26, // 13pt
          color: '1A365D',
        }),
      ],
    }),
  );

  let tocPhaseIdx = 1;
  for (const phase of template.phases) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: `Phần ${tocPhaseIdx}: ${phase.title}`,
            bold: true,
            size: 22,
            color: '2B6CB0',
          }),
        ],
      }),
    );

    let tocQIdx = 1;
    for (const tq of phase.questions) {
      const q = questionsRecord[tq.question_id];
      const qText = q ? q.text : tq.question_id;

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 280 },
          children: [
            new TextRun({
              text: `${tocPhaseIdx}.${tocQIdx}. ${qText}`,
              size: 20,
              color: '4A5568',
            }),
            ...(tq.classification === 'supplemental' ? [optionalBadge(20)] : []),
          ],
        }),
      );
      tocQIdx++;
    }
    tocPhaseIdx++;
  }

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 400 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: 'E2E8F0',
        },
      },
      children: [],
    }),
  );

  // 3. Iterate Phases & Questions Details
  let phaseIndex = 1;
  for (const phase of template.phases) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: `PHẦN ${phaseIndex}: ${phase.title.toUpperCase()}`,
            bold: true,
            size: 28, // 14pt
            color: '2B6CB0',
          }),
        ],
      }),
    );

    let qIndex = 1;
    for (const tq of phase.questions) {
      const q = questionsRecord[tq.question_id];
      const qText = q ? q.text : tq.question_id;
      const rawAnswer = input.answersMap[tq.question_id];
      const answer = (q?.options ? formatChoice(rawAnswer, q) : rawAnswer)?.trim();
      const isOptional = tq.classification === 'supplemental';

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: `${phaseIndex}.${qIndex}. ${qText}`,
              bold: true,
              size: 22, // 11pt
              color: '2D3748',
            }),
            ...(isOptional ? [optionalBadge(22)] : []),
          ],
        }),
      );

      if (answer) {
        const answerParagraphs = answer.split(/\r?\n\r?\n+/);
        for (const ap of answerParagraphs) {
          const lines = ap.trim().split(/\r?\n/);
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              indent: { left: 360 }, // 0.25 inch
              children: lines.map(
                (line, lineIndex) =>
                  new TextRun({
                    text: line,
                    break: lineIndex > 0 ? 1 : undefined,
                    size: 22,
                    color: '1A202C',
                  }),
              ),
            }),
          );
        }
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            indent: { left: 360 },
            children: [
              new TextRun({
                text: isOptional ? EMPTY_OPTIONAL_TEXT : EMPTY_REQUIRED_TEXT,
                italics: true,
                size: 20,
                color: 'A0AEC0',
              }),
            ],
          }),
        );
      }

      qIndex++;
    }

    phaseIndex++;
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
