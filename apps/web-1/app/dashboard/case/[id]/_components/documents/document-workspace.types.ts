import type {
  DocumentFile,
  DocumentUnit,
  DocumentWorkspace as DocumentWorkspaceType,
  ExternalFeedbackMetadata,
  ExternalFeedbackUnit,
} from "@/types/case";

export interface DocumentWorkspaceProps {
  workspace: DocumentWorkspaceType | null;
}

export type WorkspaceTab = "documents" | "external-feedback";
export type FilterRole = "all" | "student" | "supporter";

export type DocumentRow = {
  key: string;
  versionLabel: string;
  contextLabel: string;
  displayName: string;
  url: string | null;
  hasAction: boolean;
  sourceLabel: string;
  formatLabel: string;
  uploaderLabel: string;
  uploaderRole: "student" | "supporter" | "admin" | "other";
  createdAt: string;
};

export function formatDate(dateStr?: string | null): { date: string; time: string } {
  if (!dateStr) return { date: "—", time: "" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "—", time: "" };
    const date = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch {
    return { date: "—", time: "" };
  }
}

export function buildSupportFlowRows(units: DocumentUnit[]): DocumentRow[] {
  return units.flatMap((unit, uIdx) =>
    unit.files.map((file, fIdx) => {
      const uniqueKey = `flow-v${unit.version_no || 0}-u${unit.unit_code || uIdx}-f${file.id || file.seq || fIdx}-${fIdx}`;
      return {
        ...buildCommonRow(unit, file, uniqueKey),
        versionLabel: `v${String(unit.version_no).padStart(2, "0")}`,
        contextLabel: file.doc_type_label ?? (file.is_primary ? "Tài liệu chính" : "Output hỗ trợ"),
      };
    }),
  );
}

export function buildExternalFeedbackRows(units: ExternalFeedbackUnit[]): DocumentRow[] {
  return units.flatMap((unit, uIdx) =>
    unit.files.map((file, fIdx) => {
      const uniqueKey = `ext-a${unit.assessment_no || 0}-u${unit.unit_code || uIdx}-f${file.id || file.seq || fIdx}-${fIdx}`;
      return {
        ...buildCommonRow(unit, file, uniqueKey),
        versionLabel: `Đợt ${unit.assessment_no}`,
        contextLabel: unit.metadata
          ? `${getFeedbackSourceLabel(unit.metadata)} • v${String(unit.metadata.selected_version_no).padStart(2, "0")}`
          : unit.linked_version_no
            ? `v${String(unit.linked_version_no).padStart(2, "0")}`
            : "—",
      };
    }),
  );
}

function getFeedbackSourceLabel(metadata: ExternalFeedbackMetadata): string {
  if (metadata.source === "lecturer") return "Giảng viên";
  if (metadata.source === "mentor") return "Người hướng dẫn";
  return metadata.source_other_text || "Khác";
}

function buildCommonRow(
  unit: DocumentUnit | ExternalFeedbackUnit,
  file: DocumentFile,
  uniqueKey: string
): DocumentRow {
  const url = file.file_url || file.download_url;

  let uploaderLabel = "Khác";
  let uploaderRole: "student" | "supporter" | "admin" | "other" = "other";

  if (file.uploaded_by_role === "user") {
    uploaderLabel = "Sinh viên";
    uploaderRole = "student";
  } else if (file.uploaded_by_role === "supporter") {
    uploaderLabel = "Supporter";
    uploaderRole = "supporter";
  } else if (file.uploaded_by_role === "admin") {
    uploaderLabel = "Admin";
    uploaderRole = "admin";
  } else if (file.uploaded_by_name) {
    uploaderLabel = file.uploaded_by_name;
  } else if (file.source_kind === "generated") {
    uploaderLabel = "Hệ thống";
  } else {
    const userDocTypes = ["intake_document", "revision_document", "revision_attachment", "external_feedback", "external_evidence"];
    const supporterDocTypes = ["supporter_output", "supporter_attachment"];
    if (file.doc_type && userDocTypes.includes(file.doc_type)) {
      uploaderLabel = "Sinh viên";
      uploaderRole = "student";
    } else if (file.doc_type && supporterDocTypes.includes(file.doc_type)) {
      uploaderLabel = "Supporter";
      uploaderRole = "supporter";
    } else if (file.source_kind === "drive") {
      uploaderLabel = "Sinh viên";
      uploaderRole = "student";
    }
  }

  return {
    key: uniqueKey,
    displayName: getFileDisplayName(file, url),
    url,
    hasAction: !!(file.open_action && url),
    sourceLabel: getSourceLabel(file),
    formatLabel: getFormatLabel(file, url),
    versionLabel: "",
    contextLabel: "",
    uploaderLabel,
    uploaderRole,
    createdAt: file.created_at ?? "",
  };
}

function getFileDisplayName(file: DocumentFile, url: string | null) {
  const name = file.original_name || file.canonical_name || "";
  const fileUrl = url || "";
  const isUrl = file.source_kind === "drive" || name.startsWith("http") || (!file.extension && fileUrl);
  if (isUrl) {
    if (file.source_kind === "drive") return "Tài liệu Google Drive";
    return name || "Đường dẫn tài liệu";
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(name) && fileUrl) return file.source_kind === "drive" ? "Tài liệu Google Drive" : "Tài liệu đính kèm";

  if (name && file.extension) {
    const ext = file.extension.startsWith(".") ? file.extension : `.${file.extension}`;
    return name.endsWith(ext) ? name : `${name}${ext}`;
  }

  return name || "Tài liệu đính kèm";
}

function getFormatLabel(file: DocumentFile, url: string | null) {
  const displayName = getFileDisplayName(file, url);
  if (file.source_kind === "drive" || displayName.startsWith("http")) return "LINK";
  if (file.extension) return file.extension.replace(/^\./, "").toUpperCase();
  if (!file.mime_type) return "FILE";

  const parts = file.mime_type.split("/");
  if (parts.length < 2) return "FILE";
  const subtype = parts[1].toUpperCase();
  return subtype === "OCTET-STREAM" ? "FILE" : subtype;
}

function getSourceLabel(file: DocumentFile) {
  if (file.source_kind === "drive") return "Google Drive";
  if (file.source_kind === "generated") return "Hệ thống";
  return "Tải lên";
}

export function getFormatColor(format?: string | null): string {
  const f = format?.toUpperCase() || "";
  if (f === "PDF") return "red";
  if (f === "PPTX" || f === "PPT") return "orange";
  if (f === "DOCX" || f === "DOC") return "blue";
  if (f === "XLSX" || f === "XLS" || f === "CSV") return "teal";
  if (f === "LINK" || f === "DRIVE") return "cyan";
  if (f === "MD" || f === "TXT") return "gray";
  return "gray";
}

