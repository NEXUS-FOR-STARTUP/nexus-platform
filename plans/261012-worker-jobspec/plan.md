---
title: "Worker OMP thành engine thuần (self-contained JobSpec)"
description: "API resolve mọi domain (prompt, outputs, milestones); worker chỉ spawn OMP và watch file. Thêm/sửa dịch vụ không cần rebuild worker."
status: pending
priority: P2
effort: 4h
tags: [worker-omp, ai-engine, decoupling]
blockedBy: []
blocks: []
created: 2026-10-12
---

# Worker OMP thành engine thuần

## Overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | [API builds JobSpec](./phase-01-api-jobspec.md) | Done (2026-10-12) |
| 2 | [Worker runs spec only](./phase-02-worker-engine.md) | Done (2026-10-12, legacy fallback kept) |
| 3 | [Cutover and cleanup](./phase-03-cutover.md) | Pending (needs prod queue drain) |

Plan này chuyển mọi resolve domain sang API, worker chỉ nhận JobSpec tự chứa và chạy.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [API builds JobSpec](./phase-01-api-jobspec.md) | Pending |
| 2 | [Worker runs spec only](./phase-02-worker-engine.md) | Pending |
| 3 | [Cutover and cleanup](./phase-03-cutover.md) | Pending |

## Dependencies

- Queue drain trên prod trước khi xóa payload cũ (phase 3).
- 1 lần build/push worker cuối cùng sau phase 2; từ đó worker đóng băng trừ khi engine đổi.
