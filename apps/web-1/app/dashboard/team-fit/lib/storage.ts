// ── localStorage keys ──
export const LS_KEY_BLANKS = "team-fit:blanks";
export const LS_KEY_MEMBERS = "team-fit:members";

export function loadSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

export function removeFromLS(...keys: string[]) {
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
