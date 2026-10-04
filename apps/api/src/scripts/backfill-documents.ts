import { prisma } from "../db.js";
import {
  buildDocumentRecordInput,
  buildDocumentRecordId,
  buildReportArtifactDocumentRecordId,
} from "../modules/documents/infrastructure/persistence/document.repository.js";
import type { DocumentWriteInput } from "../modules/documents/application/document-dto.js";

interface ParsedUnitContent {
  documents?: DocumentWriteInput[];
}

interface QuarantineEntry {
  case_id: string;
  lifecycle_unit_id: string;
  reason: string;
  payload: unknown;
}

const quarantine: QuarantineEntry[] = [];

function isParsedUnitContent(value: unknown): value is ParsedUnitContent {
  return typeof value === "object" && value !== null;
}

function quarantineRow(
  caseId: string,
  lifecycleUnitId: string,
  reason: string,
  payload: unknown,
) {
  quarantine.push({ case_id: caseId, lifecycle_unit_id: lifecycleUnitId, reason, payload });
}

async function backfillCase(caseId: string, uploaderId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: { checkpoints: true, lifecycle_units: true },
  });

  if (!caseRecord) {
    console.warn('Case not found: ' + caseId);
    return;
  }

  const checkpoints = caseRecord.checkpoints;
  const currentCheckpoint =
    checkpoints.find((cp: (typeof checkpoints)[number]) => cp.checkpoint_code === caseRecord.current_checkpoint) ||
    checkpoints.sort((a: (typeof checkpoints)[number], b: (typeof checkpoints)[number]) => b.latest_version_no - a.latest_version_no)[0];

  if (!currentCheckpoint) {
    console.warn('No checkpoint found for case ' + caseId);
    return;
  }

  for (const unit of caseRecord.lifecycle_units) {
    if (unit.checkpoint_id !== currentCheckpoint.id) {
      quarantineRow(caseId, unit.id, 'unit does not belong to selected checkpoint', { unit });
      continue;
    }

    let parsedContent: ParsedUnitContent | null = null;
    if (unit.content) {
      try {
        const parsed = JSON.parse(unit.content) as unknown;
        parsedContent = isParsedUnitContent(parsed) ? parsed : null;
      } catch {
        quarantineRow(caseId, unit.id, 'malformed JSON content', { content: unit.content });
        continue;
      }
    }

    const documents: DocumentWriteInput[] = Array.isArray(parsedContent?.documents)
      ? parsedContent.documents
      : [];

    if (unit.file_url && documents.length === 0) {
      documents.push({ file_url: unit.file_url });
    }

    const unitCode = unit.unit_code;
    const direction = unit.unit_type === 'version' ? 'inbound' : 'outbound';
    const docType = unit.unit_code === 'v00' ? 'intake_document' : 'revision_document';

    let seq = 0;
    for (const doc of documents) {
      const input = buildDocumentRecordInput(
        caseId,
        currentCheckpoint.id,
        unit.id,
        unitCode,
        doc,
        seq,
        uploaderId,
        docType,
        direction,
      );
      if (!input) {
        quarantineRow(caseId, unit.id, 'empty document URL', { doc });
        continue;
      }

      await prisma.documentRecord.upsert({
        where: { id: buildDocumentRecordId(input) },
        create: { ...input, id: buildDocumentRecordId(input) },
        update: input,
      });

      seq++;
    }
  }

  const reports = await prisma.report.findMany({
    where: { case_id: caseId, status: 'APPROVED' },
  });

  for (const report of reports) {
    const linkedUnit = report.lifecycle_unit_id
      ? caseRecord.lifecycle_units.find(
          (unitRecord: (typeof caseRecord.lifecycle_units)[number]) =>
            unitRecord.id === report.lifecycle_unit_id,
        )
      : null;
    const checkpointId = linkedUnit?.checkpoint_id || report.checkpoint_id;
    const unitCode = linkedUnit?.unit_code || null;

    await prisma.documentRecord.upsert({
      where: { id: buildReportArtifactDocumentRecordId(report.id) },
      create: {
        id: buildReportArtifactDocumentRecordId(report.id),
        case_id: caseId,
        checkpoint_id: checkpointId,
        lifecycle_unit_id: report.lifecycle_unit_id,
        unit_code: unitCode,
        direction: 'system',
        doc_type: 'assessment_report',
        seq: 0,
        is_primary: true,
        source_kind: 'generated',
        canonical_name: 'report-' + report.id,
        original_name: 'Báo cáo phản biện ' + report.id.slice(-6),
        extension: 'md',
        mime_type: 'text/markdown',
        file_url: null,
        download_url: null,
        cloudinary_public_id: null,
        uploaded_by_auth_user_id: report.created_by,
      },
      update: {
        doc_type: 'assessment_report',
        source_kind: 'generated',
      },
    });
  }
}

async function writeQuarantineLog() {
  if (quarantine.length === 0) return;
  const fs = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const filePath = resolve(process.cwd(), 'plans/260630-1352-document-workspace-refactor/reports/backfill-quarantine.json');
  await fs.writeFile(filePath, JSON.stringify(quarantine, null, 2));
  console.warn('Quarantined ' + quarantine.length + ' rows; see ' + filePath);
}

async function main() {
  const caseId = process.argv[2];
  const uploaderId = process.argv[3] || 'system';

  if (caseId) {
    await backfillCase(caseId, uploaderId);
  } else {
    const cases = await prisma.case.findMany({ select: { id: true } });
    for (const c of cases) {
      await backfillCase(c.id, uploaderId);
    }
  }

  await writeQuarantineLog();
  console.log('Backfill complete');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
