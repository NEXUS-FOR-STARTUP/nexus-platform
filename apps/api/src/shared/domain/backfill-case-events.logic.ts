export interface BackfillCandidate {
  case_id: string
  event_type: string
  created_at: Date
  backfill_key: string
}

export interface ExistingEvent {
  case_id: string
  event_type: string
  created_at: Date
  backfill_key: string | null
}

/** Event types that mean "an audit started": the legacy writer and the current one. */
const START_EVENT_TYPES = ['credit_used', 'audit_started']

const equivalentTypes = (type: string): string[] => (type === 'audit_started' ? START_EVENT_TYPES : [type])

/**
 * Keeps candidates that are before the cutoff, not already backfilled, and not already logged by
 * a live or legacy writer for the same case within `windowSeconds`.
 */
export function filterBackfillRows<T extends BackfillCandidate>(
  candidates: T[],
  existing: ExistingEvent[],
  cutoff: Date,
  windowSeconds: number,
): T[] {
  const doneKeys = new Set(existing.map((e) => e.backfill_key).filter((k): k is string => k !== null))
  const byCase = new Map<string, ExistingEvent[]>()
  for (const e of existing) byCase.set(e.case_id, [...(byCase.get(e.case_id) ?? []), e])

  return candidates.filter((c) => {
    if (c.created_at >= cutoff || doneKeys.has(c.backfill_key)) return false
    const types = equivalentTypes(c.event_type)
    return !(byCase.get(c.case_id) ?? []).some(
      (e) => types.includes(e.event_type) && Math.abs(e.created_at.getTime() - c.created_at.getTime()) <= windowSeconds * 1000,
    )
  })
}
