import { test } from "node:test";
import assert from "node:assert";
import { filterBackfillRows } from "../../domain/backfill-case-events.logic.js";

const CUTOFF = new Date("2026-10-20T09:24:41Z");
const WINDOW = 120;
const at = (iso: string) => new Date(iso);
const cand = (key: string, type: string, iso: string, caseId = "c1") => ({ case_id: caseId, event_type: type, created_at: at(iso), backfill_key: key });
const live = (type: string, iso: string, caseId = "c1", key: string | null = null) => ({ case_id: caseId, event_type: type, created_at: at(iso), backfill_key: key });

test("rows at or after the cutoff are never backfilled", () => {
  const rows = [cand("a", "credits_purchased", "2026-10-20T09:24:40Z"), cand("b", "credits_purchased", "2026-10-20T09:24:41Z"), cand("c", "credits_purchased", "2026-10-21T00:00:00Z")];
  assert.deepStrictEqual(filterBackfillRows(rows, [], CUTOFF, WINDOW).map((r) => r.backfill_key), ["a"]);
});

test("an existing live audit_started excludes a consumption start inside the window", () => {
  const rows = [cand("k", "audit_started", "2026-10-15T10:00:00Z")];
  assert.strictEqual(filterBackfillRows(rows, [live("audit_started", "2026-10-15T10:01:00Z")], CUTOFF, WINDOW).length, 0);
});

test("a legacy credit_used excludes the same start", () => {
  const rows = [cand("k", "audit_started", "2026-07-24T13:49:15Z")];
  assert.strictEqual(filterBackfillRows(rows, [live("credit_used", "2026-07-24T13:49:15Z")], CUTOFF, WINDOW).length, 0);
});

test("events outside the window, on another case, or of another type do not exclude", () => {
  const rows = [cand("k", "audit_started", "2026-10-15T10:00:00Z")];
  const existing = [live("audit_started", "2026-10-15T10:02:01Z"), live("audit_started", "2026-10-15T10:00:00Z", "c2"), live("stage_opened", "2026-10-15T10:00:00Z")];
  assert.strictEqual(filterBackfillRows(rows, existing, CUTOFF, WINDOW).length, 1);
});

test("a rerun skips rows whose backfill_key was already inserted", () => {
  const rows = [cand("k1", "credit_refunded", "2026-10-15T10:00:00Z"), cand("k2", "credit_refunded", "2026-10-16T10:00:00Z")];
  const existing = [live("credit_refunded", "2026-10-15T10:00:00Z", "c1", "k1")];
  assert.deepStrictEqual(filterBackfillRows(rows, existing, CUTOFF, WINDOW).map((r) => r.backfill_key), ["k2"]);
});
