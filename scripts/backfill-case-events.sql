-- Backfill case_events for activity that happened before the timeline writers went live.
-- Rebuilds events from credit_ledgers, reports and document_records, keeping the original created_at.
--
-- Run on the VPS (psql lives in the db container). Dry run is the default and rolls back:
--   docker exec -i nexus-db psql -U "$POSTGRES_USER" -d nexus_platform -v ON_ERROR_STOP=1 < scripts/backfill-case-events.sql
-- Apply (INSERT only, one transaction):
--   docker exec -i nexus-db psql -U "$POSTGRES_USER" -d nexus_platform -v ON_ERROR_STOP=1 -v apply=1 < scripts/backfill-case-events.sql
-- Optional: -v cutoff="'2026-10-20 09:24:41'" (UTC). Only rows older than the cutoff are touched.
--
-- Idempotent: each row carries metadata_json.backfill_key and is skipped when that key already exists.
-- Skips a row when the same case already has an equivalent event within 120 s (legacy writers, live writers).
-- Limits: purchase amount_vnd is price_per_credit x credits (rounded); audit_started has no stage because
-- the ledger does not store one. Reports count only when written by the OMP audit path
-- (created_by = 'omp_worker', status = 'APPROVED'); drafts and hand-made reports are ignored.

\if :{?apply}
\else
  \set apply 0
\endif
\if :{?cutoff}
\else
  -- start of the nexus-api container that first ran the timeline writers (docker inspect State.StartedAt)
  \set cutoff '\'2026-10-20 09:24:41\''
\endif

begin;

create temp table backfill_todo on commit drop as
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
  where r.created_by = 'omp_worker' and r.status = 'APPROVED'
  union all
  -- one upload = files of the same checkpoint and uploader within the same 5 s bucket
  select d.case_id, 'stage_documents_uploaded', d.uploaded_by_auth_user_id, 'user', null, min(d.created_at),
         jsonb_build_object('checkpoint_code', cp.checkpoint_code, 'file_count', count(*),
           'file_names', jsonb_agg(d.original_name order by d.created_at)),
         'docs:' || d.checkpoint_id || ':' || d.uploaded_by_auth_user_id || ':' ||
           floor(extract(epoch from d.created_at) / 5)::bigint
  from document_records d join checkpoints cp on cp.id = d.checkpoint_id
  where d.doc_type = 'revision_document'
  group by d.case_id, d.checkpoint_id, d.uploaded_by_auth_user_id, cp.checkpoint_code,
           floor(extract(epoch from d.created_at) / 5)::bigint
) cand
where cand.created_at < :cutoff::timestamp
  and not exists (select 1 from case_events e where e.metadata_json->>'backfill_key' = cand.backfill_key)
  and not exists (
    select 1 from case_events e
    where e.case_id = cand.case_id
      and e.event_type = any (case cand.event_type
            when 'audit_started' then array['credit_used', 'audit_started']
            else array[cand.event_type] end)
      and abs(extract(epoch from e.created_at - cand.created_at)) <= 120);

\echo === would insert (by type) ===
select event_type, count(*) from backfill_todo group by 1 order by 1;
select count(*) total, min(created_at) oldest, max(created_at) newest, count(distinct case_id) cases from backfill_todo;

insert into case_events (id, case_id, event_type, actor_auth_user_id, actor_role, report_id, metadata_json, created_at)
select gen_random_uuid(), case_id, event_type, actor_auth_user_id, actor_role, report_id,
       metadata_json || jsonb_build_object('backfilled', true, 'backfill_key', backfill_key), created_at
from backfill_todo;

\if :apply
  \echo === APPLIED: committing ===
  commit;
\else
  \echo === DRY RUN: rolled back, nothing written ===
  rollback;
\endif
