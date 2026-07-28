/**
 * Domain-level enums and helper types for the normalized document workspace.
 *
 * These types are intentionally free of Prisma runtime imports and application
 * concerns. They are the source of truth for document source kinds, document
 * types, and flow directions.
 *
 * **Convention**: Cloudinary is the primary document upload mechanism.
 * `drive` source kind is deprecated for new documents but kept for backward
 * compatibility with legacy records.
 */

/**
 * Document source kinds.
 *
 * - **cloudinary** — primary upload mechanism. Intake form documents and payment
 *   proofs are uploaded via the Cloudinary Upload API and stored as public
 *   `secure_url` values.
 * - **drive** — @deprecated Kept for backward compatibility with legacy
 *   documents that still carry a Google Drive public/share link. New documents
 *   should use Cloudinary instead.
 * - **generated** — system-produced documents (AI outputs, reports, etc.).
 */
export const DOCUMENT_SOURCE_KINDS = ["drive", "cloudinary", "generated"] as const;

export type DocumentSourceKind = (typeof DOCUMENT_SOURCE_KINDS)[number];

export const DOCUMENT_TYPES = [
  "intake_document",
  "revision_document",
  "revision_attachment",
  "supporter_output",
  "supporter_attachment",
  "assessment_report",
  "external_feedback",
  "external_evidence",
  "payment_proof",
  "evidence",
  "generic",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_DIRECTIONS = ["inbound", "outbound", "system"] as const;

export type DocumentDirection = (typeof DOCUMENT_DIRECTIONS)[number];

export const DOCUMENT_TYPE_FLOWS = ["intake", "revision", "supporter_output", "external_feedback"] as const;

export type DocumentTypeFlow = (typeof DOCUMENT_TYPE_FLOWS)[number];

export const DOCUMENT_UNIT_SCOPES = ["version", "assessment"] as const;

export type DocumentUnitScope = (typeof DOCUMENT_UNIT_SCOPES)[number];

export const EXTERNAL_FEEDBACK_SOURCES = ["lecturer", "mentor", "other"] as const;

export type ExternalFeedbackSource = (typeof EXTERNAL_FEEDBACK_SOURCES)[number];

export const EXTERNAL_FEEDBACK_TIMINGS = ["pre_support", "post_support"] as const;

export type ExternalFeedbackTiming = (typeof EXTERNAL_FEEDBACK_TIMINGS)[number];

/**
 * Canonical unit code patterns.
 *
 * - v00 represents the intake unit (version_no = 1, assessment_no = 0).
 * - vNN represents a revision unit (version_no > 0, assessment_no = 0).
 * - aNN-vNN represents an assessment unit linked to a specific version.
 */
export type VersionUnitCode = `v${string}`;
export type AssessmentUnitCode = `a${string}-v${string}`;

/**
 * Human-readable policy for how a document source kind is opened or downloaded.
 *
 * - drive: public/share link; open in a new tab. No server proxy.
 * - cloudinary: public URL or short-TTL signed URL; open in a new tab.
 * - generated: download via the download_url; no server proxy for now.
 */
export interface SourceBehaviorPolicy {
  open_action: "open_url_new_tab" | "download";
  download_action: "open_url_new_tab" | "download";
}

export function deriveSourceBehaviorPolicy(
  sourceKind: DocumentSourceKind,
): SourceBehaviorPolicy {
  switch (sourceKind) {
    case "drive":
      return {
        open_action: "open_url_new_tab",
        download_action: "open_url_new_tab",
      };
    case "cloudinary":
      return {
        open_action: "open_url_new_tab",
        download_action: "open_url_new_tab",
      };
    case "generated":
      return {
        open_action: "download",
        download_action: "download",
      };
    default:
      // Exhaustiveness guard; should never happen for validated source kinds.
      return {
        open_action: "download",
        download_action: "download",
      };
  }
}
/**
 * Canonical naming helpers.
 */
export function canonicalNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const lastSegment = pathname.split("/").pop() || "";
    return decodeURIComponent(lastSegment).replace(/\s+/g, "_").slice(0, 255) || "untitled";
  } catch {
    return "untitled";
  }
}

export function extensionFromFilename(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "";
}

export function mimeTypeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    md: "text/markdown",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    zip: "application/zip",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}
import { isValidCloudinaryUrl } from '../../../services/cloudinary.js';

/**
 * Derive the document source kind from a URL.
 *
 * **Cloudinary-first**: Intake form documents now arrive via the Cloudinary
 * Upload API, so Cloudinary URLs are the common case. Drive detection is kept
 * for backward compatibility only — `drive` is deprecated for new uploads.
 *
 * Fallback: if the URL does not match any known source, it is classified as
 * `generated` (system-produced content).
 */
export function deriveSourceKindFromUrl(url: string): DocumentSourceKind {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "drive.google.com" ||
      parsed.hostname === "docs.google.com"
    ) {
      return "drive";
    }
    if (isValidCloudinaryUrl(url)) {
      return "cloudinary";
    }
  } catch {
    // fall through
  }
  return "generated";
}


