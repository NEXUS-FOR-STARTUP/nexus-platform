// ---------------------------------------------------------------------------
// Magic-byte sniffing for safe in-API file parsing (plan §8, clause 14).
// Pure and DB-free: detects PDF and OOXML (docx = ZIP container) by their
// leading bytes; everything else that passed the extension allowlist is treated
// as text (`.md` / `.txt`).
// ---------------------------------------------------------------------------

export type FileKind = "pdf" | "docx" | "text";

export function sniffFileKind(buffer: Buffer): FileKind {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("latin1") === "%PDF") {
    return "pdf";
  }
  // ZIP local file header signature `PK\x03\x04` — docx (and pptx/xlsx) are ZIP.
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "docx";
  }
  return "text";
}
