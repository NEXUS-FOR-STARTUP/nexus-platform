/** VND with comma separators, unit after number (0 stays "0 VND"). */
export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} VND`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

/** Local end of the chosen day (yyyy-mm-dd) as ISO datetime. */
export function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

/** yyyy-mm-dd, `days` from now (local). */
export function dateInputFromNow(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** yyyy-mm-ddThh:mm for datetime-local inputs (local time). */
export function datetimeLocalNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dateInputFromNow(0)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Never surface internal CP1/CP2 / "Checkpoint N" naming to users. */
export function safeLabel(name: string): string {
  return name
    .replace(/checkpoint\s*1|cp\s*1/gi, "Ý tưởng")
    .replace(/checkpoint\s*2|cp\s*2/gi, "Thị trường")
    .replace(/checkpoint\s*\d+|cp\s*\d+/gi, "");
}
