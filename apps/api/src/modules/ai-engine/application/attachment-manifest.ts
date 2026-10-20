import { basename } from "node:path";
import { canonicalizeDocCategory, docCategoryLabel } from "@repo/validation";
import type { OmpAuditInputFile } from "../omp-audit.service.js";

/** Index of the team's uploaded files, written next to them so the model need not guess what each one is. */
export const ATTACHMENT_MANIFEST_FILE = "attachments_manifest.json";

/**
 * A name no other sandbox input file uses. Strips path parts and illegal characters (the name becomes a path
 * under input/), compares case-insensitively, and falls back to an id prefix on collision. `used` must be
 * pre-seeded with every system file written to the same directory; it is updated with the returned name.
 */
export function uniqueSandboxName(rawName: string, docId: string, used: Set<string>): string {
  const safe = basename(rawName).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_") || "attachment";
  let name = safe;
  for (let n = 0; used.has(name.toLowerCase()); n++) name = `${docId.slice(0, 8)}${n > 0 ? `_${n}` : ""}_${safe}`;
  used.add(name.toLowerCase());
  return name;
}

export interface ManifestSourceDoc {
  original_name: string | null;
  extension: string | null;
  metadata_json: unknown;
}

export interface AttachmentManifestEntry {
  /** Path relative to `input/`, exactly as written in the sandbox (evidence `source` cites it). */
  file: string;
  original_name: string | null;
  extension: string | null;
  /** Category code the team picked at upload; null = uploaded before categories existed or none picked. */
  category: string | null;
  category_label: string | null;
}

function declaredCategory(metadata: unknown): string | null {
  if (typeof metadata !== "object" || metadata === null || !("category" in metadata)) return null;
  const raw = metadata.category;
  return typeof raw === "string" && raw.trim() ? canonicalizeDocCategory(raw.trim()) : null;
}

export function manifestEntry(file: string, doc: ManifestSourceDoc): AttachmentManifestEntry {
  const category = declaredCategory(doc.metadata_json);
  return {
    file,
    original_name: doc.original_name,
    extension: doc.extension,
    category,
    category_label: category ? docCategoryLabel(category) : null,
  };
}

/** `null` when there are no files: an empty index would only add noise to input/. */
export function buildAttachmentManifest(entries: readonly AttachmentManifestEntry[]): OmpAuditInputFile | null {
  if (entries.length === 0) return null;
  const manifest = {
    declared_by: "team",
    note: "category/category_label là nhãn nhóm tự chọn khi tải lên, chưa được kiểm chứng; null = chưa phân loại.",
    files: entries,
  };
  return { name: ATTACHMENT_MANIFEST_FILE, content: JSON.stringify(manifest, null, 2) };
}
