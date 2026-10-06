---
title: "Đồng bộ hóa hệ thống tài liệu và quy tắc vận hành dự án"
description: "Cập nhật toàn diện docs/, .agents/rules/, và các file AGENTS.md theo thực tế codebase để loại bỏ triệt để các blocker gây hallucination và lệch lạc hướng explore của AI agent."
status: completed
priority: P1
effort: 3h
branch: dev
tags: [documentation, rules, agents, architecture, cleanup]
blockedBy: []
blocks: []
created: 2026-10-04
---

# Đồng bộ hóa hệ thống tài liệu và quy tắc vận hành dự án

## Overview

Sau thời gian tập trung codebase-first đưa production vào hoạt động ổn định, hệ thống tài liệu (`docs/`, `.agents/rules/`, `AGENTS.md`) đã xuất hiện độ lệch lớn (drift) so với thực tế codebase. Nghiêm trọng nhất là một số tài liệu mô tả sai tech stack (HeroUI thay vì Mantine v9), che giấu các service cốt lõi (`apps/worker-omp`), dẫn hướng tới file không tồn tại, và đưa ra các số liệu sai lệch về API/DB schema.

Kế hoạch này đồng bộ lại toàn bộ tài liệu theo đúng hiện trạng HEAD, chuẩn hóa taxonomy để mọi AI agent khi tham gia làm việc đều có ngữ cảnh chính xác, không hallucinate và không đi chệch kiến trúc.

## Scope

In scope:
- Sửa các blocker trong `.agents/rules/` (`frontend-ui-rules.md`, `documentation-management.md`).
- Chuẩn hóa toàn bộ các file `AGENTS.md` (root, `apps/api`, `apps/web-1`, tạo mới cho `apps/worker-omp`).
- Sửa root `README.md` (loại bỏ thư mục ma `packages/ui`, bổ sung worker-omp và shared package).
- Đồng bộ các số liệu và sơ đồ trong `docs/codebase-summary.md`, `docs/system-architecture.md`, `docs/code-standards.md`.
- Đặt trạng thái / banner cho các tài liệu flow cũ, cập nhật trạng thái workspace tab thực tế (7 tabs).
- Cách ly vùng tài liệu tham khảo lịch sử (`docs/research/`, `docs/nexus-document/`, gộp `docs/journal/`).

Not in scope:
- Chỉnh sửa logic source code hoặc logic nghiệp vụ runtime của backend, frontend, worker.
- Chạy bất kỳ database migration hay thay đổi schema DB nào (tuân thủ nghiêm ngặt `prisma-migration-safety.md`).

## Decisions

| Decision | Choice | Why |
|---|---|---|
| UI Stack Rule | Mantine UI v9 + Tailwind CSS v4 | Khai tử triệt để dòng chữ HeroUI giả định; codebase thực tế 100% dùng Mantine v9. |
| AI Worker Entry | Tạo `apps/worker-omp/AGENTS.md` | Định nghĩa rõ ràng hợp đồng BullMQ, Redis Pub/Sub, sandbox, và khẳng định Typst PDF ở `apps/api`. |
| Auth & Middleware | Ghi nhận Next.js 16 `proxy.ts` | Khắc phục nhận định sai "no middleware guard", tài liệu hóa cơ chế server guard và maintenance mode. |
| Persona Device Scope | Student = Responsive; Admin/Supporter = Desktop-only | Phản ánh chính xác hành vi `DesktopOnlyNotice.tsx` (< 1024px) chặn admin/supporter. |
| Roadmap & Changelog | Dùng `CHANGELOG.md` + `plans/` | Loại bỏ các file ma `docs/development-roadmap.md` và `docs/project-changelog.md`. |
| Historical Quarantine | Đánh dấu rõ trong `docs/AGENTS.md` | Đưa `docs/research/`, `docs/nexus-document/`, `docs/archive/` vào nhóm Non-canonical để agent không dùng làm căn cứ kỹ thuật. |

## Cross-Plan Dependencies

Không bị block bởi plan nào. Độc lập và ưu tiên thực hiện trước khi bắt đầu các đợt phát triển tính năng mới.

## Phases

| Phase | Name | Description | Status |
|---|---|---|---|
| 1 | [Rules & Root AGENTS.md](./phase-01-rules-and-root-agents.md) | Khắc phục blocker HeroUI, file ma, cập nhật root AGENTS.md & README.md | Completed |
| 2 | [App-level AGENTS & Worker](./phase-02-app-level-agents-and-worker.md) | Cập nhật API AGENTS.md (112 routes, outbox), Web AGENTS.md (7 tabs, proxy.ts), tạo Worker AGENTS.md | Completed |
| 3 | [Canonical Core Docs Sync](./phase-03-canonical-core-docs-sync.md) | Đồng bộ codebase-summary, system-architecture, code-standards, và flows | Completed |
| 4 | [Quarantine & Cleanup](./phase-04-quarantine-and-cleanup.md) | Gộp journal thừa, dọn raw chat dump ở root, chuẩn hóa docs taxonomy | Completed |

## Success Criteria

- Không còn bất kỳ file nào trong repo nhắc tới `HeroUI`, `packages/ui`, hoặc các file ma (`docs/development-roadmap.md`, `docs/project-changelog.md`).
- Toàn bộ các file `AGENTS.md` (root, api, web-1, worker-omp) thống nhất số liệu: 15 modules, 112 endpoints, 32 models Prisma, 31 migrations, 4 packages (`@app/shared`), 48 test files.
- `apps/worker-omp` có tài liệu rõ ràng, độc lập, mô tả đầy đủ kiến trúc daemon và kênh Redis.
- Bất kỳ subagent nào khởi tạo trong tương lai đều nhận diện đúng: Mantine v9, server guard Next 16 `proxy.ts`, student responsive vs admin desktop-only.

## Handoff

```text
/ck:cook plans/261004-1744-documentation-system-alignment/plan.md
```
