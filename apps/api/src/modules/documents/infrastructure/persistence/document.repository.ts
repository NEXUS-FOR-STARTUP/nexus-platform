import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";
import {
  canonicalNameFromUrl,
  deriveSourceKindFromUrl,
  extensionFromFilename,
  mimeTypeFromExtension,
} from "../../domain/document-types.js";
import type {
  DocumentDirection,
  DocumentSourceKind,
  DocumentType,
} from "../../domain/document-types.js";
import type { ExternalFeedbackMetadata } from "../../application/validate-document-write.js";

type DocumentRecordClient = typeof prisma | Prisma.TransactionClient;

type DocumentInputLike = {
  file_url?: string;
  drive_url?: string;
  original_name?: string;
  doc_type?: string;
  document_type?: string;
  extension?: string;
  mime_type?: string;
  download_url?: string;
  cloudinary_public_id?: string;
  metadata_json?: Prisma.InputJsonValue;
};

export type CreateDocumentRecordInput = {
  case_id: string;
  checkpoint_id: string;
  lifecycle_unit_id: string | null;
  unit_code: string | null;
  direction: DocumentDirection | null;
  doc_type: DocumentType | string;
  seq: number;
  is_primary: boolean;
  source_kind: DocumentSourceKind;
  canonical_name: string | null;
  original_name: string | null;
  extension: string | null;
  mime_type: string | null;
  file_url: string | null;
  download_url: string | null;
  cloudinary_public_id: string | null;
  metadata_json?: Prisma.InputJsonValue;
  uploaded_by_auth_user_id: string;
};

export function buildDocumentRecordInput(
  caseId: string,
  checkpointId: string,
  lifecycleUnitId: string | null,
  unitCode: string | null,
  doc: DocumentInputLike,
  seq: number,
  uploaderId: string,
  defaultDocType: string,
  defaultDirection: DocumentDirection,
  category?: string,
): CreateDocumentRecordInput | null {
  const url = doc.file_url || doc.drive_url || "";
  if (!url.trim()) return null;

  const sourceKind = deriveSourceKindFromUrl(url);
  const originalName = doc.original_name || canonicalNameFromUrl(url);
  const extension = doc.extension || extensionFromFilename(originalName);
  const mimeType = doc.mime_type || mimeTypeFromExtension(extension);
  const docType = category ? defaultDocType : (doc.doc_type || doc.document_type || defaultDocType);
  const metadataJson = category
    ? { ...((doc.metadata_json ?? {}) as Record<string, unknown>), category }
    : doc.metadata_json;

  return {
    case_id: caseId,
    checkpoint_id: checkpointId,
    lifecycle_unit_id: lifecycleUnitId,
    unit_code: unitCode,
    direction: defaultDirection,
    doc_type: docType,
    seq,
    is_primary: seq === 0,
    source_kind: sourceKind,
    canonical_name: canonicalNameFromUrl(url),
    original_name: originalName,
    extension: extension || null,
    mime_type: mimeType || null,
    file_url: url,
    download_url: doc.download_url || url,
    cloudinary_public_id: doc.cloudinary_public_id || null,
    metadata_json: metadataJson,
    uploaded_by_auth_user_id: uploaderId,
  };
}

export function buildDocumentRecordId(input: Pick<CreateDocumentRecordInput, "case_id" | "checkpoint_id" | "lifecycle_unit_id" | "source_kind" | "canonical_name" | "seq">) {
  const key = [
    input.case_id,
    input.checkpoint_id,
    input.lifecycle_unit_id ?? "_orphan_",
    input.source_kind,
    input.canonical_name ?? "_",
    input.seq,
  ].join(":");
  return `doc-${stableStringHash(key)}`;
}

export function buildReportArtifactDocumentRecordId(reportId: string) {
  return `report-artifact-${reportId}`;
}

function stableStringHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export async function findDocumentRecordsByCaseId(caseId: string) {
  return await prisma.documentRecord.findMany({
    where: { case_id: caseId, superseded_at: null },
    include: {
      uploaded_by: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ checkpoint_id: "asc" }, { seq: "asc" }, { created_at: "asc" }],
  });
}

export async function findDocumentRecordsByCaseIdAndCheckpointId(
  caseId: string,
  checkpointId: string,
) {
  return await prisma.documentRecord.findMany({
    where: { case_id: caseId, checkpoint_id: checkpointId },
    include: {
      uploaded_by: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: [{ seq: "asc" }, { created_at: "asc" }],
  });
}

export async function createDocumentRecord(
  input: CreateDocumentRecordInput,
  client: DocumentRecordClient = prisma,
) {
  return await client.documentRecord.create({
    data: input as unknown as Prisma.DocumentRecordCreateInput,
  });
}

export async function createDocumentRecords(
  inputs: CreateDocumentRecordInput[],
  client: DocumentRecordClient = prisma,
) {
  if (inputs.length === 0) return [];
  return await Promise.all(
    inputs.map((input) =>
      client.documentRecord.create({
        data: input as unknown as Prisma.DocumentRecordCreateInput,
      }),
    ),
  );
}

export async function upsertDocumentRecord(
  input: CreateDocumentRecordInput,
  client: DocumentRecordClient = prisma,
) {
  const id = buildDocumentRecordId(input);
  return await client.documentRecord.upsert({
    where: { id },
    create: { id, ...(input as unknown as Prisma.DocumentRecordCreateInput) },
    update: input as unknown as Prisma.DocumentRecordUpdateInput,
  });
}

export async function createDocumentRecordsForUnit(
  caseId: string,
  checkpointId: string,
  lifecycleUnitId: string,
  unitCode: string,
  documents: DocumentInputLike[],
  uploaderId: string,
  defaultDocType: string,
  defaultDirection: DocumentDirection,
  client: DocumentRecordClient = prisma,
  metadataFactory?: (doc: DocumentInputLike, index: number) => Prisma.InputJsonValue | undefined,
  category?: string | ((doc: DocumentInputLike) => string | undefined),
) {
  const inputs: CreateDocumentRecordInput[] = [];
  let seq = 0;
  for (const doc of documents) {
    const docCategory = typeof category === "function"
      ? category(doc)
      : category;
    const input = buildDocumentRecordInput(
      caseId,
      checkpointId,
      lifecycleUnitId,
      unitCode,
      {
        ...doc,
        metadata_json: metadataFactory?.(doc, seq) ?? doc.metadata_json,
      },
      seq,
      uploaderId,
      defaultDocType,
      defaultDirection,
      docCategory,
    );
    if (!input) continue;
    inputs.push(input);
    seq++;
  }

  return await createDocumentRecords(inputs, client);
}

export async function upsertDocumentRecordsForUnit(
  caseId: string,
  checkpointId: string,
  lifecycleUnitId: string,
  unitCode: string,
  documents: DocumentInputLike[],
  uploaderId: string,
  defaultDocType: string,
  defaultDirection: DocumentDirection,
  client: DocumentRecordClient = prisma,
  category?: string | ((doc: DocumentInputLike) => string | undefined),
) {
  const created = [];
  let seq = 0;
  for (const doc of documents) {
    const docCategory = typeof category === "function"
      ? category(doc)
      : category;
    const input = buildDocumentRecordInput(
      caseId,
      checkpointId,
      lifecycleUnitId,
      unitCode,
      doc,
      seq,
      uploaderId,
      defaultDocType,
      defaultDirection,
      docCategory,
    );
    if (!input) continue;
    created.push(await upsertDocumentRecord(input, client));
    seq++;
  }
  return created;
}

export async function createReportArtifactDocumentRecord(
  caseId: string,
  checkpointId: string,
  lifecycleUnitId: string | null,
  unitCode: string | null,
  reportId: string,
  createdByUserId: string,
  client: DocumentRecordClient = prisma,
) {
  return await client.documentRecord.create({
    data: {
      case_id: caseId,
      checkpoint_id: checkpointId,
      lifecycle_unit_id: lifecycleUnitId,
      unit_code: unitCode,
      direction: "system",
      doc_type: "assessment_report",
      seq: 0,
      is_primary: true,
      source_kind: "generated",
      canonical_name: `report-${reportId}`,
      original_name: `Báo cáo phản biện ${reportId.slice(-6)}`,
      extension: "md",
      mime_type: "text/markdown",
      file_url: null,
      download_url: null,
      cloudinary_public_id: null,
      uploaded_by_auth_user_id: createdByUserId,
    },
  });
}

export async function upsertReportArtifactDocumentRecord(
  caseId: string,
  checkpointId: string,
  lifecycleUnitId: string | null,
  unitCode: string | null,
  reportId: string,
  createdByUserId: string,
  client: DocumentRecordClient = prisma,
) {
  const id = buildReportArtifactDocumentRecordId(reportId);
  return await client.documentRecord.upsert({
    where: { id },
    create: {
      id,
      case_id: caseId,
      checkpoint_id: checkpointId,
      lifecycle_unit_id: lifecycleUnitId,
      unit_code: unitCode,
      direction: "system",
      doc_type: "assessment_report",
      seq: 0,
      is_primary: true,
      source_kind: "generated",
      canonical_name: `report-${reportId}`,
      original_name: `Báo cáo phản biện ${reportId.slice(-6)}`,
      extension: "md",
      mime_type: "text/markdown",
      file_url: null,
      download_url: null,
      cloudinary_public_id: null,
      uploaded_by_auth_user_id: createdByUserId,
    },
    update: {
      case_id: caseId,
      checkpoint_id: checkpointId,
      lifecycle_unit_id: lifecycleUnitId,
      unit_code: unitCode,
      doc_type: "assessment_report",
      source_kind: "generated",
      uploaded_by_auth_user_id: createdByUserId,
    },
  });
}

export function toExternalFeedbackMetadataJson(metadata: ExternalFeedbackMetadata): Prisma.InputJsonValue {
  return {
    source: metadata.source,
    source_other_text: metadata.source_other_text ?? null,
    timing: metadata.timing,
    selected_version_no: metadata.selected_version_no,
  };
}
