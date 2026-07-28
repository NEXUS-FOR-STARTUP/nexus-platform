---
trigger: always_on
---

# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning subagents via Task tool, **ALWAYS** include in prompt:

1. **Work Context Path**: The git root of the PRIMARY files being worked on
2. **Reports Path**: `{work_context}/plans/reports/` for that project
3. **Plans Path**: `{work_context}/plans/` for that project

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project-b
Reports: /path/to/project-b/plans/reports/
Plans: /path/to/project-b/plans/"
```

**Rule:** If CWD differs from work context (editing files in different project), use the **work context paths**, not CWD paths.

---

## ⛔ ABSOLUTE DB SAFETY PROTOCOL (MANDATORY FOR ALL TASKS)

Before spawning any subagent whose task touches the database, `schema.prisma`, migration files, or any Prisma CLI command, the **orchestrator MUST**:

### 1. READ the safety rules first
```
Read .agents/rules/prisma-migration-safety.md
```
This is NON-NEGOTIABLE. Do not delegate this read — orchestrator reads it BEFORE dispatching.

### 2. Identify target database
Check `DATABASE_URL` host in `.env` (without exposing the full connection string). If host contains:
- `supabase.co` or `pooler.supabase.com` → **PRODUCTION. READ-ONLY MODE.**
- `localhost` or `127.0.0.1` or `::1` → local dev
- Unknown → **ASSUME PRODUCTION. STOP.**

### 3. Inject safety constraints into EVERY subagent prompt
Every Task tool call that involves the database MUST include this block in the prompt:

```
## ⛔ DB SAFETY: ABSOLUTE FORBIDDEN (READ THIS FIRST)
- KHÔNG chạy: prisma migrate dev, prisma migrate reset, prisma db push
- KHÔNG chạy: DROP TABLE, DROP COLUMN, DELETE FROM, TRUNCATE
- KHÔNG sửa migration file đã applied
- Nếu cần migration → chỉ tạo file với `--create-only`
- Nếu DATABASE_URL trỏ Supabase → DỪNG, báo cáo
- Rule file gốc: .agents/rules/prisma-migration-safety.md (phải đọc trước khi làm)
```

### 4. Pre-backup check
Before migration tasks, verify backup exists in `prisma/backup/`:
- Nếu backup không tồn tại → yêu cầu user backup trước
- Nếu backup >24h → cảnh báo user

### 5. Verify before reporting done
Sau khi subagent trả kết quả:
- Check `git diff` — có file ngoài scope bị sửa?
- Check `package.json` — có dep mới bị thêm?
- Check `prisma/schema.prisma` — có column bị xoá?
- Chạy `npx prisma validate`

### Penalty
Any orchestrator who delegates a DB task without these gates will cause data loss. This is a **P1 incident**. The orchestrator is responsible — not the subagent.

---

#### Sequential Chaining
Chain subagents when tasks have dependencies or require outputs from previous steps:
- **Planning → Implementation → Simplification → Testing → Review**: Use for feature development (tests verify simplified code)
- **Research → Design → Code → Documentation**: Use for new system components
- Each agent completes fully before the next begins
- Pass context and outputs between agents in the chain

#### Parallel Execution
Spawn multiple subagents simultaneously for independent tasks:
- **Code + Tests + Docs**: When implementing separate, non-conflicting components
- **Multiple Feature Branches**: Different agents working on isolated features
- **Cross-platform Development**: iOS and Android specific implementations
- **Careful Coordination**: Ensure no file conflicts or shared resource contention
- **Merge Strategy**: Plan integration points before parallel execution begins