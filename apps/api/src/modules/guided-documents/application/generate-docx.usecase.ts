import { prisma } from '../../../db.js';
import { uploadFile } from '../../../services/cloudinary.js';
import { generateGuidedDocumentDocx } from '../infrastructure/docx-generator.js';
import { AppError } from '../../../shared/domain/app-error.js';

export interface GenerateDocxInput {
  caseId: string;
  userId: string;
  templateKey?: 'cp1' | 'cp2';
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
  const checkpoint =
    caseRecord.checkpoints.find((cp) => cp.checkpoint_code === targetCode) ||
    caseRecord.checkpoints[0];

  if (!checkpoint) {
    throw new AppError(400, 'CHECKPOINT_NOT_FOUND', 'Không tìm thấy checkpoint tương ứng');
  }

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

  // Safe filename & public ID
  const timestamp = Date.now();
  const safeTitle = caseTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 40);
  const filename = `${targetCode}_${safeTitle}_${timestamp}.docx`;
  const publicId = `${targetCode}_${safeTitle}_${timestamp}`;

  // Upload to Cloudinary
  const uploadResult = await uploadFile(
    docxBuffer,
    'nexus-platform/guided-documents',
    publicId,
    'raw',
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
      download_url: uploadResult.fileUrl,
      cloudinary_public_id: uploadResult.publicId,
      seq,
      uploaded_by_auth_user_id: userId,
    },
  });

  return {
    ok: true,
    document: {
      id: docRecord.id,
      file_url: docRecord.file_url,
      original_name: docRecord.original_name,
      created_at: docRecord.created_at,
    },
  };
}
