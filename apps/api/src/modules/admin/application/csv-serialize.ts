const CSV_BOM = "\uFEFF";

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  let raw =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "string"
        ? value
        : String(value);
  if (/^[=+\-@\t\r]/.test(raw)) {
    const isPureNegativeNumber =
      raw.startsWith("-") && !Number.isNaN(Number(raw)) && raw.trim() !== "-";
    if (!isPureNegativeNumber) {
      raw = `'${raw}`;
    }
  }
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function serializeCsvRow(values: unknown[]): string {
  return `${values.map(csvEscape).join(",")}\r\n`;
}

export function serializeCsv(headers: string[], rows: unknown[][]): string {
  let body = CSV_BOM + serializeCsvRow(headers);
  for (const row of rows) {
    body += serializeCsvRow(row);
  }
  return body;
}
