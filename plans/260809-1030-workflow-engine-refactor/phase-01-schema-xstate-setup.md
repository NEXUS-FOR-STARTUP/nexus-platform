# Phase 01 — Schema + XState setup

- Priority: P1 | Status: Pending | Effort: 1h (AMENDMENT 2026-08-11: đơn giản hóa merge — dev env, chưa có user thật, dọn qua API)
- Depends: Không (phase đầu tiên)
- Blocks: Phase 02

## Overview

Cài xstate v5, migration schema (3 thay đổi: `@@unique` DocumentRecord, `version_no` trên Case, `actor_role` trên CaseEvent), tạo file types cho transition engine, giữ symflow song song.

> **Red Team áp dụng:** F2 (Case.version_no — optimistic lock chống TOCTOU), F13 (CaseEvent.actor_role — audit), F14 (unique nullable limitation — ghi chú, không cần merge phức tạp vì dev chưa user thật).

## Key Insights

- **doc_type tồn tại** (schema.prisma:247, `String @default("generic")`), **seq tồn tại** (:248), **lifecycle_unit_id tồn tại** (:244, nullable `String?`)
- **F14 — unique với nullable**: PostgreSQL coi NULL != NULL → nhiều row `lifecycle_unit_id = NULL` cùng doc_type+seq VẪN pass constraint. **Constraint chỉ bảo vệ doc CÓ lifecycle_unit_id.** Doc orphan (report artifacts...) phải giữ idempotency cũ (canonical_name trong `buildDocumentRecordId`) — ghi rõ trong code comment
- XState v5 cài `xstate` (KHÔNG `@xstate/core`). Import `import {...} from 'xstate'` — ESM/NodeNext OK
- `transition()` trả tuple `[nextState, actions]` — actions là object mô tả (KHÔNG tự chạy)
- Giữ symflow trong deps — xóa ở phase cuối

## Requirements

1. Cài xstate@latest vào apps/api
2. Migration `add_workflow_engine_schema` (1 file, 3 thay đổi — migration `--create-only`):
   - `@@unique([lifecycle_unit_id, doc_type, seq])` trên DocumentRecord
   - `version_no Int @default(0)` trên Case (F2 — optimistic lock, increment mỗi transition)
   - `actor_role String?` trên CaseEvent (F13 — audit hành động theo role)
3. Tạo `transition.types.ts` — enum transition, type Stage/Status, guard/action map
4. Validate: check-types PASS, migration file tồn tại

## Architecture

```
prisma/schema.prisma:
  model Case {
    + version_no Int @default(0)      // F2: optimistic lock — mỗi transition +1
  }
  model DocumentRecord {
    + @@unique([lifecycle_unit_id, doc_type, seq])
  }
  model CaseEvent {
    + actor_role String?              // F13: audit theo role
  }

apps/api/src/modules/cases/domain/transition.types.ts (MỚI):
  - CaseStage enum (11 giá trị — ánh xạ từ user_facing_stage)
  - InternalStatus enum (8 giá trị — ánh xạ từ internal_status)
  - TransitionName enum (T1-T16)
  - TransitionEvent type { type: TransitionName; actor: { id, role }; data?: ... }
  - TransitionContext type (rỗng — dữ liệu từ DB)
  - GuardName string union, ActionName string union
```

## Implementation Steps

### 1. Cài xstate
```bash
npm install xstate@latest --workspace=nexus-platform-api
```
Verify: `node -e "const {createMachine, transition} = require('xstate'); console.log('OK')"` (trong apps/api).

### 2. Migration — schema workflow engine
```prisma
// prisma/schema.prisma — 3 thay đổi:
// 1. model Case: thêm sau field cuối
  version_no Int @default(0)
// 2. model DocumentRecord — thêm dòng sau line 274:
  @@unique([lifecycle_unit_id, doc_type, seq])
// 3. model CaseEvent: thêm actor_role
  actor_role String?
```
Sau đó:
```bash
npx prisma validate --schema prisma/schema.prisma
DATABASE_URL=<local-url> npx prisma migrate dev --create-only --name add_workflow_engine_schema --schema prisma/schema.prisma
```
**DB SAFETY:** Chỉ `--create-only`. Đọc migration SQL sinh ra, flag nếu có DROP/ALTER destructive. Migration local chạy trước; prod deploy sau khi user confirm.

**Pre-check duplicates (local trước):**
```sql
SELECT lifecycle_unit_id, doc_type, seq, COUNT(*) as cnt
FROM document_records
WHERE lifecycle_unit_id IS NOT NULL
GROUP BY lifecycle_unit_id, doc_type, seq
HAVING COUNT(*) > 1;
```
**F14 — xử lý duplicate (AMENDMENT 2026-08-11: đơn giản hóa):**
- Prod chưa có user thật → dọn dữ liệu qua API (KHÔNG SQL thủ công): gọi API xoá các document record trùng, giữ bản `created_at` mới nhất. API xoá sẽ tự dọn Cloudinary.
- Sau khi dọn sạch → thêm constraint unique vào DB.
- Tạo migration DOWN file (DROP constraint + DROP COLUMN) — rollback thủ công nếu cần.

**F14 — giới hạn constraint:** unique chỉ bảo vệ doc CÓ `lifecycle_unit_id`. Doc orphan (`lifecycle_unit_id = NULL`) vẫn có thể trùng → giữ idempotency `canonical_name` như code hiện tại (`buildDocumentRecordId`). Ghi comment trong schema.

### 3. transition.types.ts
```typescript
// apps/api/src/modules/cases/domain/transition.types.ts

export const CASE_STAGES = [
  'intake_pending', 'intake_ready', 'submitted',
  'need_more_information', 'under_review', 'report_ready',
  'waiting_for_revision', 'revision_submitted',
  'completed', 'rejected', 'closed'
] as const;
export type CaseStage = typeof CASE_STAGES[number];

export const INTERNAL_STATUSES = [
  'triage_pending', 'accepted_unassigned', 'assigned',
  'waiting_user', 'supporter_working',
  'report_ready_to_publish', 'done', 'cancelled'
] as const;
export type InternalStatus = typeof INTERNAL_STATUSES[number];

// 16 transitions
export type TransitionName =
  | 'T1_CREATE_CASE' | 'T2_SUBMIT_INTAKE' | 'T3_RESUBMIT_AFTER_REJECT'
  | 'T4_RESUBMIT_AFTER_VETO' | 'T5_ACCEPT' | 'T6_ASSIGN_SUPPORTER'
  | 'T7_START_WORK' | 'T8_REQUEST_INFO' | 'T9_SUBMIT_REVISION'
  | 'T10_START_REVIEW_REVISION' | 'T11_SUBMIT_OUTPUT'
  | 'T12_REJECT' | 'T13_VETO' | 'T14_COMPLETE'
  | 'T15_CANCEL' | 'T16_EDIT_INTAKE';

// Transition event đầu vào cho machine
export interface TransitionEvent {
  type: TransitionName;
  actor: { id: string; role: string };
  data?: Record<string, unknown>;
}

// Context rỗng — dữ liệu từ DB qua executor
export interface TransitionContext {}

// Stage + status pair (đầu ra của transition)
export interface StageStatus {
  stage: CaseStage;
  status: InternalStatus;
}

// Guard names (string map trong setup)
export type GuardName =
  | 'isOwnerOrMember' | 'isOwner' | 'isAssignedSupporter'
  | 'isAdmin' | 'isSupporter' | 'hasCredit'
  | 'isWithin48h' | 'isBeforeSubmission'
  | 'reasonMinLength';

// Action names (string map trong setup)
export type ActionName =
  | 'createCase' | 'upsertDoc' | 'subtractCredit'
  | 'refundCredit' | 'setSlaDeadline' | 'emitStageChanged'
  | 'notifyUser' | 'resetStatus' | 'autoResumeWork'
  | 'lockPrice';

// Action descriptor — XState transition() trả về mảng các object này
// Executor loop (Phase 03) đọc type + params để dispatch DB operations
export interface ActionDescriptor {
  type: ActionName;
  params?: unknown;
}
```

### 4. Verify sau setup
```bash
npm run check-types          # root — expect PASS (xstate type-safe)
npm test                     # API only — test hiện tại vẫn pass (chưa đụng engine cũ)
```

## Todo List

- [ ] Cài xstate@latest
- [ ] Verify import hoạt động (xstate ESM/NodeNext)
- [ ] Sửa schema.prisma — 3 thay đổi: `@@unique` DocumentRecord + `version_no` Case + `actor_role` CaseEvent
- [ ] Validate schema
- [ ] Chạy migration `--create-only` local (`add_workflow_engine_schema`)
- [ ] Review SQL migration file (flag destructive) + viết down migration
- [ ] Check duplicates local trước constraint (SELECT chỉ đọc). Nếu có → gọi API xoá duplicate giữ newest created_at (AMENDMENT 2026-08-11: dev env, chưa user thật)
- [ ] Tạo `transition.types.ts`
- [ ] check-types PASS (root)
- [ ] npm test PASS (API)

## Success Criteria

- `xstate` trong apps/api/package.json
- Migration file `add_workflow_engine_schema` tồn tại, SQL không destructive, có down migration
- Case có `version_no` (F2), CaseEvent có `actor_role` (F13), DocumentRecord có `@@unique` (F14)
- `transition.types.ts` compile, export đủ types cho phase 02
- check-types root PASS, test API pass (engine cũ chưa bị đụng)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Duplicate data → unique constraint fail | Trung bình | Cao | SELECT check trước; merge strategy cụ thể (keep newest created_at — F14) |
| XState v5 không resolve NodeNext | Thấp | Cao | Đã verify researcher-02: exports field chuẩn, NodeNext OK. Nếu fail → fallback dynamic import |
| Migration local chạy nhưng SQL có DROP | Thấp | Cao | Chỉ `--create-only`; đọc SQL thủ công; down migration sẵn (F14) |
| Quên verify duplicate → fail prod deploy | Trung bình | Cao | Migration checklist bắt buộc pre-check; test trên clone prod DB (F14) |
| version_no thêm vào Case — code cũ không set → default 0 OK | Thấp | Thấp | `@default(0)` — backward compatible. Case cũ bắt đầu version 0 |

## Security Considerations

- Migration tuân `prisma-migration-safety.md`: chỉ `--create-only`, không destructive, backup trước prod
- XState không có network call — không surface attack
- `actor_role` chỉ nhận giá trị từ session (F6/F13) — dữ liệu audit đáng tin

## Next Steps

→ Phase 02: Viết `transition-registry.ts` từ bảng transition v2, dùng types từ phase này.
