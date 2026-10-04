# Phase 01: Config.ts — Xóa Triệt Để Code Windows

## Target
`apps/worker-omp/src/config.ts`

## Context
OMP worker chạy exclusively trong Docker container (Linux). Toàn bộ code xử lý Windows (`win32` gate, `findWindowsExe`, `USERPROFILE`, `.cmd` shim) là dead weight — không bao giờ được gọi trong container Linux.

## Changes

### 1. Xóa import `delimiter`
**Line 2:**
```ts
// Before
import { resolve, delimiter } from "node:path";
// After
import { resolve } from "node:path";
```

### 2. Xóa `OMP_BIN` export
**Line 26:**
```ts
// Xóa hoàn toàn dòng này:
export const OMP_BIN = process.env.OMP_BIN || "omp";
```

### 3. Xóa JSDoc Windows workaround & nhánh `win32` trong `resolveAgentRuntime()`
**Lines 29-49:** Xóa toàn bộ block comment và nhánh `if (process.platform === "win32") { ... }`.
Nhánh Linux được giữ lại và chuyển `OMP_BIN` thành `"omp"` literal:
```ts
export function resolveAgentRuntime(): { runCmd: string; baseArgs: string[] } {
  const HOME_DIR = process.env.HOME || "/root";
  const OMP_CLI = resolve(
    HOME_DIR,
    ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js",
  );
  const isDirectCli = existsSync(OMP_CLI);
  return { runCmd: isDirectCli ? "bun" : "omp", baseArgs: isDirectCli ? [OMP_CLI] : [] };
}
```

### 4. Xóa hàm `findWindowsExe()`
**Lines 54-71:** Xóa toàn bộ hàm `findWindowsExe()` và JSDoc của nó.

### 5. Xóa `USERPROFILE` ở tất cả các vị trí
Docker container là Linux, chỉ dùng biến `HOME`. Cần xóa `process.env.USERPROFILE` ở 3 vị trí:
1. **Line 38:** `process.env.USERPROFILE || process.env.HOME || "/root"` → `process.env.HOME || "/root"`
2. **Line 76:** `const HOME_DIR = process.env.USERPROFILE || process.env.HOME || "/root"` → `const HOME_DIR = process.env.HOME || "/root"`
3. **Line 87:** `const home = process.env.USERPROFILE || process.env.HOME || "/root"` → `const home = process.env.HOME || "/root"`

## Acceptance
- [x] `config.ts` không còn import `delimiter`.
- [x] Không còn bất kỳ từ khóa nào: `win32`, `findWindowsExe`, `OMP_BIN`, `USERPROFILE`.
- [x] `resolveAgentRuntime()` chỉ có 1 luồng xử lý duy nhất cho Linux container.
- [x] `bun run check-types` pass không có lỗi.
