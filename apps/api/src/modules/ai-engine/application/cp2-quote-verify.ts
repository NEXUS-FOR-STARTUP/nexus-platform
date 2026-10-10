export interface QuoteSource {
  /** Attachment file name. */
  name: string;
  /** Extracted text; null when the format cannot be parsed here (.xlsx, .pptx, ...). */
  text: string | null;
}

export interface QuoteEvidenceInput {
  checks: ReadonlyArray<{ id: string; evidence: ReadonlyArray<{ source: string; quote: string }> }>;
  crossIssues: ReadonlyArray<{ evidence: ReadonlyArray<{ source: string; quote: string }> }>;
}

export interface QuoteVerification {
  /** Check ids (or `cross_issue_N`) with at least one quote that is not in its source. */
  unverified: string[];
  /** Ids whose quotes come from a file format we cannot read; not counted as wrong. */
  unchecked: string[];
}

const QUESTION_SOURCE = /^(cp2_[a-z0-9_]+|cp2_answers\.md|self_checks\.md)$/i;

/** NFC + collapsed whitespace on both sides, so line breaks and spacing never cause a false mismatch. */
export function normalizeQuoteText(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

function sourceBaseName(source: string): string {
  const parts = source.split(/[\\/]/);
  return normalizeQuoteText(parts[parts.length - 1] ?? "").toLowerCase();
}

type Verdict = "ok" | "unverified" | "unchecked";

export function verifyCp2Quotes(
  report: QuoteEvidenceInput,
  internalTexts: readonly string[],
  attachments: readonly QuoteSource[],
): QuoteVerification {
  const internal = internalTexts.map(normalizeQuoteText);
  const files = attachments.map((a) => ({ name: a.name.toLowerCase(), text: a.text === null ? null : normalizeQuoteText(a.text) }));
  const hasUnreadable = files.some((f) => f.text === null);

  const judge = (source: string, quoteRaw: string): Verdict => {
    const quote = normalizeQuoteText(quoteRaw);
    if (quote === "") return "unverified";
    const base = sourceBaseName(source);
    const named = files.find((f) => f.name === base);
    if (named) {
      if (named.text === null) return "unchecked";
      return named.text.includes(quote) ? "ok" : "unverified";
    }
    if (internal.some((t) => t.includes(quote)) || files.some((f) => f.text?.includes(quote))) return "ok";
    // Source is not a question id or known file name: the quote may sit in a file we cannot read.
    if (!QUESTION_SOURCE.test(base) && hasUnreadable) return "unchecked";
    return "unverified";
  };

  const unverified = new Set<string>();
  const unchecked = new Set<string>();
  const run = (id: string, evidence: ReadonlyArray<{ source: string; quote: string }>) => {
    for (const item of evidence) {
      const verdict = judge(item.source, item.quote);
      if (verdict === "unverified") unverified.add(id);
      else if (verdict === "unchecked") unchecked.add(id);
    }
  };
  for (const check of report.checks) run(check.id, check.evidence);
  report.crossIssues.forEach((issue, index) => run(`cross_issue_${index + 1}`, issue.evidence));

  // A check with both a wrong quote and an unreadable one is reported once, as unverified.
  for (const id of unverified) unchecked.delete(id);
  return { unverified: [...unverified], unchecked: [...unchecked] };
}
