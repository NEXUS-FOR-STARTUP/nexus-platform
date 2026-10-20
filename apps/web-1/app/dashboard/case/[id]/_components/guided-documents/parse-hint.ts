export interface ParsedHint {
  lead: string;
  need: string[];
  bad: string;
  good: string;
  example: string;
  notes: string[];
}

const stripQuotes = (s: string) => s.replace(/"/g, "").trim();

/**
 * Splits a catalog `explanation` into the parts the hint panel renders separately:
 * lead sentence, "Cần nêu" bullets, good/bad examples and trailing notes.
 */
export function parseHint(text: string): ParsedHint {
  const hint: ParsedHint = { lead: "", need: [], bad: "", good: "", example: "", notes: [] };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    let m: RegExpMatchArray | null;
    if (line.startsWith("- ")) hint.need.push(line.slice(2));
    else if ((m = line.match(/^Không đạt:\s*(.*)/))) hint.bad = stripQuotes(m[1]);
    else if ((m = line.match(/^Đạt:\s*(.*)/))) hint.good = stripQuotes(m[1]);
    else if ((m = line.match(/^Ví dụ( Pass)?:\s*(.*)/))) {
      hint.example = (m[1] ? "Pass: " : "") + stripQuotes(m[2]).replace(/ (Fail|Nếu fail): /g, "\n$1: ");
    } else if (!hint.lead) hint.lead = line.replace(/\s*Cần nêu:?$/, "");
    else hint.notes.push(line);
  }
  return hint;
}
