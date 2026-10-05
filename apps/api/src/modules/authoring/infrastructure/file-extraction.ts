import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { AppError } from "../../../shared/domain/app-error.js";
import { sniffFileKind, type FileKind } from "../domain/file-sniff.js";

// ---------------------------------------------------------------------------
// In-API text extraction (plan §7.2, §8). Extracted text is UNTRUSTED DATA:
// it is only ever treated as a string field value, never as control flow. The
// extension allowlist + 15MB cap + magic-byte sniff are enforced by the caller
// (`validateManagedDocumentFile` semantics) before this module is reached.
// ---------------------------------------------------------------------------

export type ManagedUploadFile = {
  name: string;
  size: number;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export interface ExtractionResult {
  kind: FileKind;
  text: string;
}

function decodeText(buffer: Buffer): string {
  const text = buffer.toString("utf8");
  // Strip a UTF-8 BOM if present.
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export async function extractDocumentText(
  file: ManagedUploadFile,
): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const kind = sniffFileKind(buffer);

  if (kind === "text") {
    return { kind, text: decodeText(buffer) };
  }

  if (kind === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { kind, text: result.value ?? "" };
    } catch (err) {
      throw new AppError(
        400,
        "DOCX_EXTRACTION_FAILED",
        "Không thể đọc nội dung tệp .docx",
      );
    }
  }

  // PDF
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy().catch(() => {});
    return { kind, text: result.text ?? "" };
  } catch (err) {
    throw new AppError(
      400,
      "PDF_EXTRACTION_FAILED",
      "Không thể đọc nội dung tệp .pdf",
    );
  }
}
