/**
 * Backfill case_events for activity that happened before the timeline writers shipped (2026-10-20 09:18 UTC).
 * Rebuilds events from credit_ledgers, reports and document_records, keeping the original created_at.
 *
 *   bun scripts/backfill-case-events.ts            # dry run, READONLY_DATABASE_URL, prints what would be inserted
 *   BACKFILL_DATABASE_URL=... bun scripts/backfill-case-events.ts --apply   # INSERT only, one transaction
 *
 * Idempotent: every row carries metadata_json.backfill_key and is skipped when that key already exists.
 * Limits: purchase amount_vnd is price_per_credit x credits (rounded); audit_started has no stage because
 * the ledger does not store one.
 */
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const APPLY = process.argv.includes('--apply')
const DOCUMENT_GROUP_WINDOW_SECONDS = 5
const LEGACY_MATCH_WINDOW_SECONDS = 120
const SAMPLE_ROWS = 15

const connectionString = APPLY ? process.env.BACKFILL_DATABASE_URL : process.env.READONLY_DATABASE_URL
if (!connectionString) {
  console.error(APPLY ? 'BACKFILL_DATABASE_URL is required with --apply' : 'READONLY_DATABASE_URL is required')
  process.exit(1)
}

interface EventRow {
  case_id: string
  event_type: string
  actor_auth_user_id: string
  actor_role: 'user' | 'system'
  report_id: string | null
  created_at: Date
  metadata_json: Record<string, unknown>
  backfill_key: string
}

const CANDIDATES_SQL = `
select * from (
  select l.case_id, 'credits_purchased' event_type, c.owner_auth_user_id actor_auth_user_id, 'user' actor_role,
         null::text report_id, l.created_at,
         jsonb_build_object('quantity', l.amount, 'service_type', st.code, 'order_id', l.reference_id,
           'amount_vnd', round(coalesce((l.metadata_json->>'price_per_credit')::numeric, 0) * l.amount),
           'new_balance', l.balance_after) metadata_json,
         'ledger:' || l.id backfill_key
  from credit_ledgers l join cases c on c.id = l.case_id left join service_types st on st.id = l.service_type_id
  where l.type = 'purchase'
  union all
  select l.case_id, 'credit_refunded', c.owner_auth_user_id, 'system', null, l.created_at,
         jsonb_build_object('credits', l.amount, 'reason', l.metadata_json->>'reason', 'service_type', st.code,
           'balance_after', l.balance_after),
         'ledger:' || l.id
  from credit_ledgers l join cases c on c.id = l.case_id left join service_types st on st.id = l.service_type_id
  where l.type = 'refund'
  union all
  select l.case_id, 'audit_started', c.owner_auth_user_id, 'system', null, l.created_at,
         jsonb_build_object('credit_charged', true, 'service_type', st.code),
         'ledger:' || l.id
  from credit_ledgers l join cases c on c.id = l.case_id left join service_types st on st.id = l.service_type_id
  where l.type = 'consumption'
  union all
  select r.case_id, 'audit_completed', c.owner_auth_user_id, 'system', r.id, r.created_at,
         jsonb_build_object('checkpoint', cp.checkpoint_code, 'report_id', r.id),
         'report:' || r.id
  from reports r join cases c on c.id = r.case_id join checkpoints cp on cp.id = r.checkpoint_id
  union all
  select d.case_id, 'stage_documents_uploaded', d.uploaded_by_auth_user_id, 'user', null, min(d.created_at),
         jsonb_build_object('checkpoint_code', cp.checkpoint_code, 'file_count', count(*),
           'file_names', jsonb_agg(d.original_name order by d.created_at)),
         'docs:' || d.checkpoint_id || ':' || d.uploaded_by_auth_user_id || ':' ||
           floor(extract(epoch from d.created_at) / $1)::bigint
  from document_records d join checkpoints cp on cp.id = d.checkpoint_id
  where d.doc_type = 'revision_document'
  group by d.case_id, d.checkpoint_id, d.uploaded_by_auth_user_id, cp.checkpoint_code,
           floor(extract(epoch from d.created_at) / $1)::bigint
) cand
where not exists (select 1 from case_events e where e.metadata_json->>'backfill_key' = cand.backfill_key)
  -- legacy writers (before Aug 2026) already logged purchases and credit use for the same moment
  and not exists (
    select 1 from case_events e
    where e.case_id = cand.case_id
      and e.event_type = case cand.event_type when 'audit_started' then 'credit_used' else cand.event_type end
      and abs(extract(epoch from e.created_at - cand.created_at)) <= $2)
order by created_at`

async function main() {
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    const { rows } = await client.query<EventRow>(CANDIDATES_SQL, [DOCUMENT_GROUP_WINDOW_SECONDS, LEGACY_MATCH_WINDOW_SECONDS])
    const byType = rows.reduce<Record<string, number>>((acc, r) => ((acc[r.event_type] = (acc[r.event_type] ?? 0) + 1), acc), {})
    console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: ${rows.length} events to insert`, byType)
    console.table(rows.slice(0, SAMPLE_ROWS).map((r) => ({ type: r.event_type, at: r.created_at.toISOString(), key: r.backfill_key })))
    if (!APPLY || rows.length === 0) return

    await client.query('begin')
    try {
      for (const r of rows) {
        await client.query(
          `insert into case_events (id, case_id, event_type, actor_auth_user_id, actor_role, report_id, metadata_json, created_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [randomUUID(), r.case_id, r.event_type, r.actor_auth_user_id, r.actor_role, r.report_id,
            JSON.stringify({ ...r.metadata_json, backfilled: true, backfill_key: r.backfill_key }), r.created_at],
        )
      }
      await client.query('commit')
      console.log(`Inserted ${rows.length} events`)
    } catch (err) {
      await client.query('rollback')
      throw err
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
