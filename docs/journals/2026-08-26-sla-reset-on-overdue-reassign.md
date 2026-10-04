# Journal: SLA reset khi phân công lại quá hạn

**Date:** 2026-08-26

**Branch:** `feat/gap-analysis-tasks`

**Plan:** `plans/260826-1328-sla-reset-on-overdue-reassign/`

**Commit:** `c76f2be` `fix(cases): reset SLA only on overdue T6 reassign` — chưa push

**Status:** Implemented + 68/68 tests + review 9/10 (0 critical). Auto-approved với warning.

## Bug

Case `supporter_working` quá hạn (NX-647364) gán supporter mới vẫn "Quá hạn". T6 self-loop, người mới không chạy T7. `setSlaDeadline` chỉ T7/T19.

## Rule

- `sla_deadline_at <= now` + T6 → `now + 48h`
- `sla_deadline_at > now` + T6 → giữ
- null → không ghi (T7 set lần đầu)

## Fix

Action mới `resetSlaIfOverdue` trên mọi T6 (kể first assign). Không tái sử dụng `setSlaDeadline`. Unassign / same-supporter no-op / T7 / T9 / T19 / FE không đụng.

## Verify

`npx tsx --test` 2 file: 68 pass, 0 fail. `tsc --noEmit` sạch.

## Review leftover

- Extra `findUniqueOrThrow` trong action (cùng tx đã load case).
- Test chưa pin `sla_deadline_at === now`.
