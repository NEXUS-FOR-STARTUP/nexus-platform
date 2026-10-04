# Researcher-02: XState v5 — Nghiên cứu đổi engine workflow (symflow → XState v5)

**Ngày:** 2026-08-09
**Người:** Technical Analyst
**Phạm vi:** Máy trạng thái "chạy 1 lần khi transition" (KHÔNG actor nền). Mỗi HTTP request thực thi 1 transition trên 1 case. 16 transitions, guard + action theo tên, entry action = save DB async, sau commit = emit event bus.
**Constraints:** TypeScript ESM, moduleResolution NodeNext, Node built-in test runner (node:test), Hono.

---

## 1. Version ổn định + cài đặt

- **Gói:** `xstate` (KHÔNG `@xstate/core`). `@xstate/core` là micro-gói v4 cũ; v5 gộp hết vào `xstate`.
- **Version:** v5 line stable, ~`5.19.x` (5.2026). Xác nhận `npm i xstate@latest` khi cài. Có ESM-only cả CJS lẫn ESM.
- **ESM/NodeNext:** OK. XState v5 dùng `exports` field đầy đủ → NodeNext resolve tốt. Không có vấn đề build đã biết với NodeNext + `import ... from 'xstate'`.

```bash
npm install xstate        # apps/api
```

---

## 2. Pattern máy THUẦN — chạy 1 transition, không interpret nền

**ĐÚNG pattern cần dùng:** hàm `transition(machine, state, event)` — **không cần** `interpret()/createActor()`, **không `start()`**.

```ts
import { createMachine, transition } from 'xstate';

// mỗi request:
const restored = machine.resolveState(JSON.parse(db.internal_status)); // tái lập từ stage string
const [nextState, actions] = transition(machine, restored, event);     // => [snapshot, actions]
db.internal_status = JSON.stringify(nextState);                        // save snapshot
for (const action of actions) await execute(action);                   // thực thi action (async)
```

`transition()` trả tuple `[nextState, actions]` — actions là **object mô tả**, KHÔNG tự chạy. Bạn tự loop + await. **Đây chính là điểm mạnh cho pattern "1 request / 1 transition":** kiểm soát hoàn toàn thứ tự, await async, commit DB rồi mới emit.

### Async entry actions — TRADE-OFF QUAN TRỌNG

XState v5 **không hỗ trợ async entry action**. Entry action bị gọi đồng bộ; nếu đặt `await` bên trong sẽ bị fire-and-forget, không chờ được → không kiểm soát commit/emit.

**2 lựa chọn:**

| Cách | Mô tả | Ưu | Nhược |
|------|-------|-----|-------|
| **A. KHÔNG đặt async trong entry** (KHUYẾN NGHỊ) | Entry chỉ là action mô tả (tên hàm như `'saveDoc'`). Trong `execute(action)`, mỗi action tự quyết định: `saveDoc` → `await db.save()`, `emitEvent` → `await bus.emit()` | Đơn giản, đúng quy tắc XState, kiểm soát thứ tự + await rõ ràng | Bạn phải tự viết executor loop (đơn giản ~15 dòng) |
| B. Dùng actor + `waitFor` | `createActor()` + chờ snapshot | Không cần tự loop | Trái yêu cầu "không actor nền"; phức tạp, thừa cho pattern 1-request |

**Kết luận:** Chọn **cách A** — async nằm trong executor (`execute(action)`), KHÔNG trong entry machine. Entry chỉ khai báo tên. Đúng KISS + YAGNI.

> LƯU Ý: actions trong tuple được resolve **tuần tự**, mỗi action nhìn context mới nhất (sau các `assign` trước đó). Executor loop phải giữ thứ tự mảng.

---

## 3. Cấu hình guard + actions theo tên (strings) — syntax v5

Trong v5 dùng `setup({ guards, actions })` thay cho tham số thứ 2 deprecated của `createMachine`. `cond` → đã đổi tên thành `guard` (v5 dev-time error nếu dùng `cond`).

```ts
const machine = setup({
  types: {
    context: {} as { id: string },
    events: {} as { type: 'SUBMIT' } | { type: 'APPROVE' }
  },
  guards: {
    isOwner: ({ context, event }) => /* boolean */,
    canApprove: ({ context, event }) => /* boolean */
  },
  actions: {
    saveDoc: () => {/* KHÔNG async ở đây — chỉ mô tả */},
    emitSubmitted: () => {}
  }
}).createMachine({
  context: { id: '' },
  initial: 'draft',
  states: {
    draft: {
      on: {
        SUBMIT: {
          target: 'pending',
          guard: 'isOwner',
          actions: ['saveDoc', 'emitSubmitted']   // actions theo tên (string)
        }
      }
    },
    pending: {
      on: {
        APPROVE: {
          target: 'approved',
          guard: 'canApprove'
        }
      }
    }
  }
});
```

- Guard theo tên: `guard: 'isOwner'` (string).
- Transition actions theo tên: `actions: ['saveDoc', 'emitSubmitted']`.
- Guard có tham số: `guard: { type: 'canApprove', params: { role: 'ADMIN' } }`.
- Action có tham số: `{ type: 'saveDoc', params: { docId: 'x' } }`.

---

## 4. Typegen — có nên dùng không?

- **Setup:** `xstate init` tạo `.typegen.ts`, cần chạy watcher trong dev, tích hợp tsconfig. Chi phí ~thêm tooling.
- **Lợi ích:** type-safe event/context/state across machine — hay cho máy lớn, nhiều người sửa.
- **Chi phí/dự án này:** máy nhỏ (16 transitions, 1 file, context rỗng). Typegen = over-engineering cho scope hiện tại.
- **KHUYẾN NGHỊ:** **BỎ typegen** (KISS, YAGNI). `setup({ types })` thủ công đã cho type-safe đủ dùng (declare `context`, `events`). Thêm typegen sau nếu máy phình to. Lưu ý: bỏ typegen = mất auto-type inference của `EventFrom`/context — bù bằng khai báo `types` thủ công trong `setup`.

---

## 5. Stately Studio

- **XÁC NHẬN: KHÔNG cần.** Chỉ dùng để visualize/edit trực quan máy. Không cần thiết build/runtime. Code-first hoàn toàn đủ. (Bỏ qua, YAGNI.)

---

## 6. Đọc package.json `apps/api`

```json
// apps/api/package.json — dependencies có liên quan
"type": "module",
"dependencies": {
  "symflow": "^3.5.1",   // ENGINE HIỆN TẠI
  "hono": "^4.12.27",
  ...
},
"scripts": {
  "test": "tsx --test src/shared/infrastructure/tests/*.test.ts",  // node:test
}
```

- `symflow` **^3.5.1** — đổi sang `xstate`.
- Chưa có xstate trong deps → cài mới.

---

## 7. Migration path: symflow → XState

- **Khác biệt chính:** symflow lưu marking trên cột `internal_status` (DB). XState v5 stateless: **state sống trong snapshot object, không trong machine**. → Pattern "stateless machine + DB snapshot" **CHUẨN** (canonical trong XState docs cho serverless/workflow: `JSON.parse(db.state)` → `transition` → `JSON.stringify`).
- Mỗi request: đọc `internal_status` → `machine.resolveState(JSON.parse(...))` (hoặc từ stage string, xem #10) → `transition` → ghi snapshot lại cột sau commit.
- **Mapping 1-1:** symflow config 8 places / 9 transitions → 8 state nodes / 16 transitions XState. Guard symflow tương ứng `guard`, action tương ứng `actions` string.
- **LƯU Ý:** symflow action = sync marking update. XState action mô tả → bạn phải tự executor để gọi DB + event bus (xem #2). Đây là thay đổi kiến trúc cốt lõi cần làm rõ trong plan.
- Không actor nền: không dùng `createActor/interpret`. Giữ DB là single source of truth, máy thuần.

---

## 8. Test — node:test đủ, KHÔNG cần package thêm

- XState v5 **không cần actor** để test. `transition(machine, state, event)` trả `[nextState, actions]` thuần → assert trực tiếp.
- **KHÔNG dùng @xstate/test** (model-based testing — over-engineering cho scope này). **Bỏ.**
- `node:test` + `node:assert` **đủ**, hợp đồng bộ với project.

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transition, initialTransition } from 'xstate';
import { getCaseMachine } from './machine.js';

test('SUBMIT draft → pending', () => {
  const [s0] = initialTransition(getCaseMachine());
  const [s1, actions] = transition(s0, { type: 'SUBMIT' });
  assert.equal(s1.value, 'pending');                 // state value
  assert.equal(s1.context.id, 'expected');           // context snapshot
  assert.deepEqual(actions.map(a => a.type), ['saveDoc', 'emitSubmitted']); // actions mô tả
});

test('guard chặn APPROVE sai role', () => {
  const [s0] = initialTransition(getCaseMachine());
  const [s1] = transition(s0, { type: 'SUBMIT' });
  const [s2] = transition(s1, { type: 'APPROVE', by: 'member' });
  assert.equal(s2.value, 'pending'); // guard false → không đổi state
});
```

- Snapshot persistence test: `JSON.parse(JSON.stringify(s1))` round-trip → assert value.

---

## 9. TypeScript / NodeNext — build OK

- XState v5 xuất `exports` field chuẩn → **`import ... from 'xstate'` hoạt động với NodeNext, ESM.** (Xác nhận qua web/Context7.)
- Project dùng `.js` specifier cho relative imports — không ảnh hưởng vì xstate import qua package name, không phải relative path.
- `setup({ types: { context, events } })` cho type-safe thủ công — thay thế typegen.
- Lưu ý: tuỳ version TS (project ^5.8.3), xstate cần TS ≥ 5.0 — OK. Không có breaking build đã biết.

---

## 10. Edge: tái lập máy từ stage string (context = rỗng)

**Pattern đơn giản nhất (KISS):** lưu `state.value` (stage string) vào cột DB. Mỗi request build lại snapshot bằng `machine.resolveState()`.

```ts
// DB lưu stage string: "pending"
function restoreMachine(stage: string) {
  return machine.resolveState({
    value: stage,
    context: {},            // context rỗng — dữ liệu nằm DB, không trong máy
    historyValue: {},       // XState v5 yêu cầu field này
    status: 'active'
  });
}
```

- **LUÔN dùng `resolveState()`** (không phải thủ công object) — nó validate + hoàn thiện history/primitives cần thiết.
- Context rỗng = dữ liệu case lấy từ DB qua closure/executor, không nhét vào machine → máy giữ thuần, stateless. Đúng pattern.
- Nếu muốn context nhỏ (vd `caseId`), set trong restore; nhưng với "context rỗng" thì DB là nguồn dữ liệu duy nhất.

---

## Tổng kết ranked recommendation

1. **Cài `xstate` (v5 ~5.19+, KHÔNG @xstate/core).** Compatible ESM/NodeNext.
2. **Pattern thuần:** `transition(machine, restoredState, event)` — **không actor, không interpret/start**. Mỗi request 1 transition.
3. **Async action:** KHÔNG đặt async trong entry. Entry chỉ khai báo tên; tự viết executor loop `for (a of actions) await execute(a)` — save DB → emit event bus sau commit.
4. **Guard/actions theo tên:** `setup({ guards: {...}, actions: {...} })` + `guard: 'name'`, `actions: ['name']`. Accessor cũ `cond` bỏ.
5. **BỎ typegen** (KISS/YAGNI) — dùng `setup({ types })`.
6. **BỎ Stately Studio.**
7. **Stateless machine + DB snapshot** = chuẩn XState cho workflow/serverless.
8. **Test:** node:test đủ, `transition()` assert. Bỏ @xstate/test.
9. **Build NodeNext:** OK không vấn đề.
10. **Restore:** `machine.resolveState({ value: stage, context: {}, historyValue: {}, status: 'active' })`.

---

## Unresolved questions / chưa cover

- **Version chính xác hiện tại:** đã xác nhận v5 line ~5.19+; **KHÔNG xác nhận số x.x.x cụ thể ngày 2026-08** (giới hạn 5 tool calls). Chạy `npm i xstate@latest` rồi đọc `node_modules/xstate/package.json` khi implement.
- **Chi tiết event bus hiện tại (tên hàm, sync/async):** chưa đọc code — cần lấy từ `shared/domain/domain-events.ts` khi plan (9 event types đã ghi trong AGENTS.md).
- **Cấu trúc symflow config hiện tại (8 places/9 transitions):** chưa đọc source — mapping 1-1 cần đối chiếu code thực tế khi migrate.
- **`resolveState` field chính xác cho v5.19**: `historyValue` có thể đổi tên trong version mới — xác nhận qua type của thư viện khi implement.
