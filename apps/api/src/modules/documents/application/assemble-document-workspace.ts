import type {
  DocumentCheckpoint,
  DocumentCheckpointOverview,
  DocumentFile,
  DocumentUnit,
  DocumentWorkspace,
  ExternalFeedbackUnit,
  ExternalFeedbackMetadata,
} from '../domain/document-contract.js';
import { deriveSourceBehaviorPolicy, deriveSourceKindFromUrl } from '../domain/document-types.js';
import type { DocumentSourceKind } from '../domain/document-types.js';
import { generateSignedUrl, extractPublicId, extractVersion } from '../../../services/cloudinary.js';

type PrismaCaseWithRelations = {
  id: string;
  current_checkpoint?: string | null;
  checkpoints: Array<{
    id: string;
    checkpoint_code: string;
    latest_version_no: number;
    latest_assessment_no: number;
  }>;
  lifecycle_units: Array<{
    id: string;
    checkpoint_id: string;
    unit_code: string;
    unit_type: string;
    version_no: number;
    assessment_no: number;
    linked_version_no: number | null;
    file_url: string | null;
    content: string | null;
    created_at?: Date | string;
  }>;
  document_records: Array<{
    id: string;
    checkpoint_id: string;
    lifecycle_unit_id: string | null;
    unit_code: string | null;
    doc_type: string;
    seq: number;
    is_primary: boolean;
    source_kind: string;
    canonical_name: string | null;
    original_name: string | null;
    extension: string | null;
    mime_type: string | null;
    file_url: string | null;
    download_url: string | null;
    metadata_json?: unknown;
    uploaded_by?: {
      name: string;
      role: string;
    } | null;
    created_at?: Date | string;
  }>;
};

export function assembleDocumentWorkspace(
  caseRecord: PrismaCaseWithRelations,
  docTypes?: Array<{ code: string; label: string }>,
): DocumentWorkspace {
  const checkpoints = caseRecord.checkpoints || [];
  const selectedCheckpoint = selectCheckpoint(caseRecord, checkpoints);

  const workspaceCheckpoints: DocumentCheckpoint[] = checkpoints.map((cp) => {
    const units = caseRecord.lifecycle_units.filter((u) => u.checkpoint_id === cp.id);
    const records = caseRecord.document_records.filter((r) => r.checkpoint_id === cp.id);

    const versionUnits = buildVersionUnits(units, records, docTypes);
    const assessmentUnits = buildAssessmentUnits(records, docTypes);
    const supportFlowDocuments = buildSupportFlowDocuments(units, records, docTypes);
    const externalFeedbackDocuments = buildExternalFeedbackDocuments(units, records, docTypes);

    const totalFiles = supportFlowDocuments.reduce((sum, unit) => sum + unit.files.length, 0) +
      externalFeedbackDocuments.reduce((sum, unit) => sum + unit.files.length, 0);

    const overview: DocumentCheckpointOverview = {
      total_files: totalFiles,
      version_count: supportFlowDocuments.length,
      assessment_count: externalFeedbackDocuments.length,
      selected_label:
        selectedCheckpoint?.id === cp.id ? 'Đang chọn ' + cp.checkpoint_code : cp.checkpoint_code,
    };

    return {
      checkpoint_id: cp.id,
      checkpoint_code: cp.checkpoint_code,
      overview,
      version_units: versionUnits,
      assessment_units: assessmentUnits,
      support_flow_documents: supportFlowDocuments,
      external_feedback_documents: externalFeedbackDocuments,
      latest_version_no: cp.latest_version_no,
    };
  });

  return {
    selected_checkpoint_id: selectedCheckpoint?.id ?? null,
    checkpoints: workspaceCheckpoints,
  };
}

function selectCheckpoint(
  caseRecord: PrismaCaseWithRelations,
  checkpoints: PrismaCaseWithRelations['checkpoints'],
) {
  if (caseRecord.current_checkpoint) {
    const matched = checkpoints.find((cp) => cp.checkpoint_code === caseRecord.current_checkpoint);
    if (matched) return matched;
  }

  let selected = checkpoints[0] ?? null;
  for (const checkpoint of checkpoints) {
    if (!selected || checkpoint.latest_version_no > selected.latest_version_no) {
      selected = checkpoint;
      continue;
    }

    if (
      checkpoint.latest_version_no === selected.latest_version_no &&
      checkpoint.latest_assessment_no > selected.latest_assessment_no
    ) {
      selected = checkpoint;
    }
  }

  return selected;
}

function buildVersionUnits(
  units: PrismaCaseWithRelations['lifecycle_units'],
  records: PrismaCaseWithRelations['document_records'],
  docTypes?: Array<{ code: string; label: string }>,
): DocumentUnit[] {
  const versionUnits = units.filter((u) => u.unit_type === 'version');

  return versionUnits
    .map((unit) => {
      const unitRecords = records.filter((r) => r.lifecycle_unit_id === unit.id);
      const studentDocTypes = ['intake_document', 'revision_document'];
      const hasStudentDocInRecords = unitRecords.some((r) => studentDocTypes.includes(r.doc_type));

      const files = [
        ...unitRecords.map((r) => toDocumentFile(r, docTypes)),
        ...(!hasStudentDocInRecords ? legacyFilesFromUnit(unit) : []),
      ];

      return {
        unit_code: unit.unit_code,
        version_no: unit.version_no,
        assessment_no: 0,
        linked_version_no: null,
        files,
      };
    })
    .sort((a, b) => b.version_no - a.version_no);
}

function buildAssessmentUnits(
  records: PrismaCaseWithRelations['document_records'],
  docTypes?: Array<{ code: string; label: string }>,
): DocumentUnit[] {
  const assessmentRecords = records.filter((r) => r.doc_type === 'assessment_report');

  const grouped = new Map<string, typeof assessmentRecords>();
  for (const record of assessmentRecords) {
    const key = record.unit_code || 'orphan-' + record.id;
    const group = grouped.get(key) || [];
    group.push(record);
    grouped.set(key, group);
  }

  return Array.from(grouped.entries())
    .map(([unitCode, group]) => {
      return {
        unit_code: unitCode,
        version_no: 0,
        assessment_no: parseAssessmentNo(unitCode),
        linked_version_no: parseLinkedVersionNo(unitCode),
        files: group.map((r) => toDocumentFile(r, docTypes)),
      };
    })
    .sort((a, b) => {
      const byAssessment = b.assessment_no - a.assessment_no;
      if (byAssessment !== 0) return byAssessment;
      const left = b.linked_version_no ?? -1;
      const right = a.linked_version_no ?? -1;
      return left - right;
    });
}
function legacyFilesFromUnit(
  unit: PrismaCaseWithRelations['lifecycle_units'][number],
): DocumentFile[] {
  const files: DocumentFile[] = [];
  if (unit.file_url) {
    const sourceKind = deriveSourceKindFromUrl(unit.file_url);
    const policy = deriveSourceBehaviorPolicy(sourceKind);

    let fileUrl = unit.file_url;
    let originalName: string | null = null;
    let extension: string | null = null;

    if (sourceKind === 'cloudinary') {
      const publicId = extractPublicId(fileUrl);
      if (publicId) {
        const cleanUrl = fileUrl.split('?')[0].split('#')[0];
        const filenameWithExt = cleanUrl.split('/').pop() || 'document.pdf';
        const dotIndex = filenameWithExt.lastIndexOf('.');
        if (dotIndex !== -1) {
          originalName = filenameWithExt;
          extension = filenameWithExt.substring(dotIndex + 1);
        } else {
          originalName = filenameWithExt + '.pdf';
          extension = 'pdf';
        }
        const version = extractVersion(fileUrl);
        fileUrl = generateSignedUrl(publicId, undefined, originalName, version);
      }
    }

    files.push({
      id: 'legacy-' + unit.id,
      seq: 0,
      is_primary: true,
      doc_type: 'intake_document',
      doc_type_label: 'Hồ sơ nộp',
      source_kind: sourceKind,
      canonical_name: originalName,
      original_name: originalName,
      extension: extension,
      mime_type: extension === 'pdf' ? 'application/pdf' : null,
      file_url: fileUrl,
      download_url: fileUrl,
      open_action: policy.open_action,
      download_action: policy.download_action,
      created_at: unit.created_at ? (typeof unit.created_at === 'string' ? unit.created_at : unit.created_at.toISOString()) : new Date().toISOString(),
    });
  }
  return files;
}
function toDocumentFile(
  record: {
    id: string;
    seq: number;
    is_primary: boolean;
    doc_type: string;
    source_kind: string;
    canonical_name: string | null;
    original_name: string | null;
    extension: string | null;
    mime_type: string | null;
    file_url: string | null;
    download_url: string | null;
    metadata_json?: unknown;
    uploaded_by?: {
      name: string;
      role: string;
    } | null;
    created_at?: Date | string;
  },
  docTypes?: Array<{ code: string; label: string }>,
): DocumentFile {
  const sourceKind = record.source_kind as DocumentSourceKind;
  const policy = deriveSourceBehaviorPolicy(sourceKind);

  // VERIFY-002 fix: sign Cloudinary URLs with short-TTL
  let fileUrl = record.file_url;
  let downloadUrl = record.download_url;

  if (sourceKind === 'cloudinary') {
    const defaultFilename = (fileUrl || downloadUrl || '').split('?')[0].split('#')[0].split('/').pop() || 'document.pdf';
    const filename = record.original_name || record.canonical_name || defaultFilename;

    if (fileUrl) {
      const publicId = extractPublicId(fileUrl);
      if (publicId) {
        const version = extractVersion(fileUrl);
        fileUrl = generateSignedUrl(publicId, undefined, filename, version);
      }
    }
    if (downloadUrl) {
      const publicId = extractPublicId(downloadUrl);
      if (publicId) {
        const version = extractVersion(downloadUrl);
        downloadUrl = generateSignedUrl(publicId, undefined, filename, version);
      }
    }
  }

  const DEFAULT_DOC_TYPE_LABELS: Record<string, string> = {
    intake_document: "Hồ sơ nộp",
    revision_document: "Bản sửa đổi",
    revision_attachment: "Tài liệu bổ sung bản sửa",
    supporter_output: "Output hỗ trợ",
    supporter_attachment: "Tài liệu đính kèm hỗ trợ",
    assessment_report: "Báo cáo đánh giá",
    external_feedback: "Đánh giá bên ngoài",
    external_evidence: "Minh chứng bên ngoài",
  };

  const docTypeLabel = docTypes?.find((dt) => dt.code === record.doc_type)?.label 
    || DEFAULT_DOC_TYPE_LABELS[record.doc_type] 
    || "Tài liệu";

  const metadata =
    record.metadata_json && typeof record.metadata_json === "object"
      ? (record.metadata_json as Record<string, unknown>)
      : null;
  const category =
    metadata && typeof metadata.category === "string" ? metadata.category : null;

  return {
    id: record.id,
    seq: record.seq,
    is_primary: record.is_primary,
    doc_type: record.doc_type,
    doc_type_label: docTypeLabel,
    category,
    source_kind: sourceKind,
    canonical_name: record.canonical_name,
    original_name: record.original_name,
    extension: record.extension,
    mime_type: record.mime_type,
    file_url: fileUrl,
    download_url: downloadUrl,
    open_action: fileUrl ? policy.open_action : null,
    download_action: downloadUrl ? policy.download_action : null,
    uploaded_by_name: record.uploaded_by?.name ?? null,
    uploaded_by_role: record.uploaded_by?.role ?? null,
    created_at: record.created_at ? (typeof record.created_at === 'string' ? record.created_at : record.created_at.toISOString()) : new Date().toISOString(),
  };
}

function parseAssessmentNo(unitCode: string): number {
  const match = /^a(\d+)-v\d+$/.exec(unitCode);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function parseLinkedVersionNo(unitCode: string): number | null {
  const match = /^a\d+-v(\d+)$/.exec(unitCode);
  return match ? Number.parseInt(match[1], 10) : null;
}

function buildSupportFlowDocuments(
  units: PrismaCaseWithRelations['lifecycle_units'],
  records: PrismaCaseWithRelations['document_records'],
  docTypes?: Array<{ code: string; label: string }>,
): DocumentUnit[] {
  const versionUnits = units.filter((u) => u.unit_type === 'version');
  const supportDocTypes = ['intake_document', 'revision_document', 'revision_attachment', 'supporter_output', 'supporter_attachment', 'evidence', 'generic'];

  return versionUnits
    .map((unit): DocumentUnit | null => {
      const unitRecords = records.filter((r) => r.lifecycle_unit_id === unit.id);
      const supportRecords = unitRecords.filter((r) => supportDocTypes.includes(r.doc_type));

      const studentDocTypes = ['intake_document', 'revision_document'];
      const hasStudentDocInRecords = supportRecords.some((r) => studentDocTypes.includes(r.doc_type));

      const files = [
        ...supportRecords.map((r) => toDocumentFile(r, docTypes)),
        ...(!hasStudentDocInRecords ? legacyFilesFromUnit(unit) : []),
      ];

      if (files.length === 0) {
        return null;
      }

      return {
        unit_code: unit.unit_code,
        version_no: unit.version_no,
        assessment_no: 0,
        linked_version_no: null,
        files,
      };
    })
    .filter((unit): unit is DocumentUnit => unit !== null)
    .sort((a, b) => b.version_no - a.version_no);
}

function buildExternalFeedbackDocuments(
  units: PrismaCaseWithRelations['lifecycle_units'],
  records: PrismaCaseWithRelations['document_records'],
  docTypes?: Array<{ code: string; label: string }>,
): ExternalFeedbackUnit[] {
  const assessmentUnits = units.filter((u) => u.unit_type === 'assessment');
  const feedbackDocTypes = ['external_feedback', 'external_evidence'];

  const feedbackUnits: ExternalFeedbackUnit[] = [];

  for (const unit of assessmentUnits) {
    const unitRecords = records.filter((r) => r.lifecycle_unit_id === unit.id);
    const feedbackRecords = unitRecords.filter((r) => feedbackDocTypes.includes(r.doc_type));

    if (feedbackRecords.length === 0) continue;

    const metadata = extractExternalFeedbackMetadata(feedbackRecords[0]);

    feedbackUnits.push({
      unit_code: unit.unit_code,
      assessment_no: unit.assessment_no,
      linked_version_no: unit.linked_version_no,
      files: feedbackRecords.map((r) => toDocumentFile(r, docTypes)),
      metadata,
    });
  }

  return feedbackUnits.sort((a, b) => {
    const byAssessment = b.assessment_no - a.assessment_no;
    if (byAssessment !== 0) return byAssessment;
    const left = b.linked_version_no ?? -1;
    const right = a.linked_version_no ?? -1;
    return left - right;
  });
}

function extractExternalFeedbackMetadata(
  record: PrismaCaseWithRelations['document_records'][number],
): ExternalFeedbackMetadata | null {
  if (!record.metadata_json || typeof record.metadata_json !== 'object') {
    return null;
  }

  const meta = record.metadata_json as Record<string, unknown>;
  const source = typeof meta.source === 'string' ? meta.source : null;
  const timing = typeof meta.timing === 'string' ? meta.timing : null;
  const selectedVersionNo = typeof meta.selected_version_no === 'number' ? meta.selected_version_no : null;

  if (!source || !timing || selectedVersionNo === null) {
    return null;
  }

  return {
    source: source as ExternalFeedbackMetadata['source'],
    source_other_text: typeof meta.source_other_text === 'string' ? meta.source_other_text : null,
    timing: timing as ExternalFeedbackMetadata['timing'],
    selected_version_no: selectedVersionNo,
  };
}
