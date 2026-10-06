# Documentation System & Operating Rules Alignment

**Date**: 2026-10-04 18:00  
**Status**: Resolved  
**Scope**: Documentation, Rules, AGENTS.md, Architecture Sync, Cleanup  
**Plan**: `plans/261004-1744-documentation-system-alignment/plan.md`  

---

## 1. What Happened

Sau giai đoạn tập trung codebase-first đưa hệ thống lên production ổn định, hệ thống tài liệu (`docs/`, `.agents/rules/`, `AGENTS.md`) xuất hiện độ lệch lớn (drift) so với thực tế. Nghiêm trọng nhất là tài liệu quy định sai UI stack (HeroUI thay vì Mantine v9), che giấu sự tồn tại của daemon worker `apps/worker-omp` và package `packages/shared`, dẫn hướng tới các file không tồn tại (`docs/development-roadmap.md`, `docs/project-changelog.md`), và đưa ra các số liệu sai lệch về API/DB. Đồng thời, thư mục docs còn tồn đọng các bản nháp ChatGPT và spec cũ gây nhiễu context cho AI agent.

## 2. Technical Decisions

1. **Khắc phục Triệt để Blocker Gây Hallucination trong Rules**:
   - Sửa `.agents/rules/frontend-ui-rules.md`: Khai tử hoàn toàn dòng chữ "HeroUI + Tailwind", chuẩn hóa thành "Mantine UI v9 + Tailwind CSS v4".
   - Sửa `.agents/rules/documentation-management.md`: Xóa bỏ các file ma, trỏ về `CHANGELOG.md` và `plans/`; sửa đường dẫn `./.agents/rules/development-rules.md`.
2. **Đồng bộ hóa Toàn diện Số liệu Hệ thống**:
   - Cập nhật root `AGENTS.md`, `apps/api/AGENTS.md`, `README.md`, `codebase-summary.md`, `system-architecture.md`, `code-standards.md` khớp chính xác với thực tế tại HEAD:
     - **15 modules** API (thêm `profile`, `deposits`, `orders`, `wallet`, `auth`).
     - **112 endpoints** (108 module routes + 4 system endpoints + Better Auth catch-all).
     - **32 models Prisma** và **31 migrations** (mới nhất: `20260923213000_add_performance_indexes`).
     - **4 packages** monorepo (ghi nhận `@app/shared` cho worker metrics).
     - **48 test files** tại backend.
     - **2 Outbox Relays**: `DomainEventOutbox` (crash recovery 5s) và `NotificationOutbox` (2s tick).
3. **Tài liệu hóa Đầy đủ Ứng dụng & Quy ước Thiết bị**:
   - Viết mới `apps/worker-omp/AGENTS.md`: Mô tả đầy đủ BullMQ `omp-queue`, sandbox filesystem `storage/jobs/${caseId}/${jobId}/`, dual-publish Redis, và ranh giới sinh PDF tại API.
   - Cập nhật `apps/web-1/AGENTS.md`: Ghi nhận Next.js 16 server-side route guard (`proxy.ts`), chế độ bảo trì `MAINTENANCE_MODE`, Case Workspace đủ 7 tabs, Admin đủ 7 tabs, 37 custom hooks và đường dẫn quy chuẩn từ ngữ UX tại `design-system/wording/`.
   - Khẳng định bất đối xứng thiết bị: Student dashboard hỗ trợ mobile responsive; Admin và Supporter là **Desktop-only tuyệt đối** (`DesktopOnlyNotice.tsx` < 1024px).
4. **Dọn dẹp và Cách ly Tài liệu Lịch sử (Quarantine)**:
   - Gộp folder `docs/journal/` lẻ vào `docs/journals/`.
   - Di chuyển 2 file dump chat ở root vào `docs/archive/reference/` kèm banner cảnh báo.
   - Xoá sạch 3 file rác: `NEXUS_DOCUMENT_SYSTEM_COMPLETE_SPEC.md` (duplicate 100%), `docs/archive/system-architecture.md` (stub link gãy), và `docs/archive/web-spec/` (10 files đặc tả cũ lỗi thời).
   - Phân định rạch ròi nhóm tài liệu Canonical vs Non-canonical trong `docs/AGENTS.md` và `docs/ai-rules/documentation-rules.md`.

## 3. Key Changes

- `.agents/rules/frontend-ui-rules.md`: Chuẩn hóa Mantine v9.
- `.agents/rules/documentation-management.md`: Sửa liên kết và quy tắc tài liệu.
- `AGENTS.md` & `README.md`: Đồng bộ cấu trúc monorepo và số liệu hệ thống.
- `apps/api/AGENTS.md`: Bổ sung 15 modules, 112 routes, 2 outbox relays.
- `apps/web-1/AGENTS.md`: Bổ sung 7 tabs, server guard, 37 hooks.
- `apps/worker-omp/AGENTS.md`: Tạo mới tài liệu kiến trúc worker.
- `docs/codebase-summary.md` & `docs/system-architecture.md`: Cập nhật sơ đồ và số liệu.
- `docs/code-standards.md`: Cập nhật testing và quy tắc an toàn DB.
- `docs/journals/`: Viết bù 10 bản journal cho các plan đã hoàn thành.

## 4. Verification

- Kiểm tra toàn bộ repo không còn chữ `HeroUI`, `packages/ui` hay các file ma.
- Toàn bộ các file `AGENTS.md` thống nhất số liệu 100%.
- Thư mục gốc sạch sẽ, các tài liệu thừa đã được dọn sạch.
