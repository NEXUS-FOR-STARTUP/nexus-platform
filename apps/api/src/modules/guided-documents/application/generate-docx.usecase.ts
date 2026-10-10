import { prisma } from '../../../db.js';
import { uploadFile, generateSignedUrl } from '../../../services/cloudinary.js';
import { generateGuidedDocumentDocx } from '../infrastructure/docx-generator.js';
import { AppError } from '../../../shared/domain/app-error.js';
import { TEMPLATE_REGISTRY, type TemplateKey } from '@repo/validation';

const FILENAME_TEAM_MAX_LENGTH = 40;
const FILENAME_DOC_TYPE_MAX_LENGTH = 40;

export interface GenerateDocxInput {
  caseId: string;
  userId: string;
  templateKey?: TemplateKey;
}

export async function generateDocxUseCase(input: GenerateDocxInput) {
  const { caseId, userId, templateKey = 'cp1' } = input;

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      checkpoints: {
        orderBy: { created_at: 'asc' },
      },
    },
  });

  if (!caseRecord) {
    throw new AppError(404, 'CASE_NOT_FOUND', 'Không tìm thấy hồ sơ');
  }

  // Find corresponding checkpoint or first checkpoint
  const targetCode = templateKey.toUpperCase();
  // Team-Fit-created cases have no checkpoint until intake is submitted. Create CP1
  // lazily and set current_checkpoint so submit-intake reuses this row instead of
  // inserting a second CP1.
  const checkpoint =
    caseRecord.checkpoints.find((cp) => cp.checkpoint_code === targetCode) ||
    caseRecord.checkpoints[0] ||
    (await prisma.$transaction(async (tx) => {
      const created = await tx.checkpoint.create({
        data: {
          case_id: caseId,
          checkpoint_code: 'CP1',
          checkpoint_status: 'submitted',
          latest_version_no: 1,
        },
      });
      await tx.case.update({
        where: { id: caseId },
        data: { current_checkpoint: 'CP1' },
      });
      return created;
    }));

  // Fetch answers
  const answers = await prisma.projectAnswer.findMany({
    where: { case_id: caseId },
  });

  const answersMap: Record<string, string> = {};
  for (const ans of answers) {
    answersMap[ans.question_id] = ans.answer_text;
  }

  const caseTitle = caseRecord.team_name || caseRecord.case_code;

  // Generate buffer synchronously
  const docxBuffer = await generateGuidedDocumentDocx({
    templateKey,
    answersMap,
    caseTitle,
  });

  // Filename: case code + team name + document type + timestamp. The template key
  // (CP1/CP2…) is internal and deliberately not exposed to users.
  const timestamp = Date.now();
  const toSlug = (value: string, maxLength: number) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9-]+/g, '_')
      .slice(0, maxLength)
      .replace(/^_+|_+$/g, '');
  const filenameParts = [
    caseRecord.case_code,
    caseRecord.team_name ? toSlug(caseRecord.team_name, FILENAME_TEAM_MAX_LENGTH) : '',
    toSlug(TEMPLATE_REGISTRY[templateKey].title, FILENAME_DOC_TYPE_MAX_LENGTH),
    String(timestamp),
  ].filter(Boolean);
  const filename = `${filenameParts.join('_')}.docx`;
  const publicId = filename;

  // Upload to Cloudinary
  const uploadResult = await uploadFile(
    docxBuffer,
    'nexus-platform/guided-documents',
    publicId,
    'raw',
  );

  const fullPublicId = uploadResult.publicId.startsWith('nexus-platform/guided-documents/')
    ? uploadResult.publicId
    : `nexus-platform/guided-documents/${uploadResult.publicId}`;

  const downloadUrl = generateSignedUrl(
    fullPublicId,
    3600 * 24 * 7, // 7 days
    filename,
  );

  // Compute seq
  const lastDoc = await prisma.documentRecord.findFirst({
    where: { case_id: caseId, checkpoint_id: checkpoint.id },
    orderBy: { seq: 'desc' },
  });
  const seq = (lastDoc?.seq ?? 0) + 1;

  // Create DocumentRecord
  const docRecord = await prisma.documentRecord.create({
    data: {
      case_id: caseId,
      checkpoint_id: checkpoint.id,
      doc_type: `guided_${templateKey}`,
      source_kind: 'system_generated',
      canonical_name: filename,
      original_name: filename,
      extension: '.docx',
      mime_type:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_url: uploadResult.fileUrl,
      download_url: downloadUrl,
      cloudinary_public_id: fullPublicId,
      seq,
      uploaded_by_auth_user_id: userId,
    },
  });

  return {
    ok: true,
    document: {
      id: docRecord.id,
      file_url: docRecord.file_url,
      download_url: downloadUrl,
      original_name: docRecord.original_name,
      canonical_name: docRecord.canonical_name,
      created_at: docRecord.created_at,
    },
  };
}
