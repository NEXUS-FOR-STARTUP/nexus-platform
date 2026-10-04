# Research Report: Chiến lược tài liệu hóa "Future Work" trong docs/

**Date:** 2026-08-06  
**Quyết định cuối cùng:** `docs/backlog/` — structured future work (1 file/item)  
**Scope:** Cách tổ chức tài liệu cho "việc sẽ làm", "nên làm", "lưu ý cho tương lai"

---

## Executive Summary

Hiện tại "future work" trong Nexus Platform bị phân mảnh qua 6+ nơi: requirements Deferred, PRD out-of-scope, journal Next Steps, plan phase files, inline ⚠️ notes, project-context assumptions/risks. Không có cơ chế tập trung.

**.agents/rules/documentation-management.md** đã mandate 2 file quan trọng nhưng **chưa tồn tại**: `docs/development-roadmap.md` và `docs/project-changelog.md`. Đây là lỗ hổng structural lớn nhất — agent rules yêu cầu update sau mỗi feature/milestone nhưng file chưa được tạo.

Giải pháp: tận dụng cấu trúc có sẵn, tạo 2 file mandated + bổ sung section "Future Work" trong `project-context.md`, không tạo folder mới.

---

## Research Methodology

- Sources: toàn bộ `docs/` tree (25 entries), `.agents/rules/documentation-management.md`, `docs/ai-rules/documentation-rules.md`, `docs/AGENTS.md`, `docs/README.md`
- Date range: 2026-07-21 đến 2026-08-06 (codebase hiện tại)
- Key terms: future work, roadmap, changelog, deferred, backlog, technical debt, lessons learned

---

## Key Findings

### 1. Hiện trạng — "Future work" phân mảnh 6+ nơi

| Nơi | Dạng content | Vấn đề |
|-----|-------------|--------|
| `requirements/README.md` → `## Deferred` | Feature-level deferred scope | Đang "(None)" — chưa dùng |
| `prd/core-product-prd.md` → `Ngoài phạm vi` | MVP out-of-scope items | Chỉ liệt kê scope boundary, không có next step |
| `flows/*.md` → status `Deferred` | Deferred flows (vd: payment-verification-flow) | Rải rác từng file |
| `journals/*.md` → `## Next Steps` | Implementation completion notes | Không canonical, ghi 1 lần rồi bỏ |
| `plans/*/phase-*.md` → checkbox todo lists | Active execution tasks | Chỉ tồn tại trong plan đang chạy |
| `project-context.md` → `## Giả định`, `## Rủi ro đã biết` | Assumptions, known risks | Business-level, không phải technical todo |
| Inline ⚠️ notes (`deploy-log.md`, `system-architecture.md`) | Verification debt, stale code warnings | Trùng lặp, không DRY |

**Vấn đề chính:** Không ai biết tất cả "việc cần làm trong tương lai" nằm ở đâu. Mỗi lần nhìn lại phải scan 6+ file.

### 2. File mandated nhưng MISSING

`.agents/rules/documentation-management.md` lines 8-11 mandate:

```
docs/development-roadmap.md   → Living roadmap: phases, milestones, progress
docs/project-changelog.md     → Record of all significant changes, features, fixes
```

Update triggers defined (lines 13-18):
- Sau mỗi feature implementation → update roadmap + changelog
- Sau mỗi major milestone → review roadmap phases
- Sau mỗi bug fix → document in changelog
- Sau mỗi security update → record improvements
- Weekly review → update progress percentages

**Cả 2 file chưa được tạo.** Đây là lỗ hổng #1 cần giải quyết.

### 3. Quy tắc documentation hiện hành

Từ `docs/ai-rules/documentation-rules.md`:
- **Không tạo top-level folder trong `docs/`** nếu chưa có lý do rõ (line 25)
- **Không tạo file mới** nếu thông tin thuộc file canonical đã có (line 26)
- **Không duplicate** cùng định nghĩa ở nhiều file (line 36)
- **Business-first**: không viết technical trước business context (line 31)
- **Thiếu dữ liệu phải gán nhãn**: `Missing`, `Unclear`, `Needs decision`, `Assumption` (line 48-51)

### 4. Cấu trúc plans/ hiện có

`plans/` đã hoạt động cho execution planning với format `plans/<timestamp>-<name>/`:
- `plan.md` — overview
- `phase-XX-name.md` — từng phase với todo list
- `research/` — research sub-outputs
- `reports/` — scout/researcher reports

Nhưng `plans/` là **execution workspace** (ngắn hạn), không phải **canonical knowledge** (dài hạn).

---

## Comparative Analysis

### Option A: Tạo 2 file mandated + section trong project-context (RECOMMENDED)

**Tạo:**
1. `docs/development-roadmap.md` — roadmap sống: phases, milestones, progress, future plans
2. `docs/project-changelog.md` — changelog: features, fixes, security updates
3. `docs/project-context.md` → bổ sung `## Công việc tương lai & Lưu ý (Future Work & Notes)`

**Pros:**
- Tuân thủ agent rules đã có
- Không tạo folder mới, không duplicate
- Tận dụng cấu trúc canonical
- "Việc sẽ làm" → roadmap, "đã làm" → changelog, "lưu ý" → project-context
- Business-first: roadmap là product-level, không phải technical todo list

**Cons:**
- Cần discipline update sau mỗi feature/milestone (đã có trigger rule)

### Option B: Tạo `docs/_future-work/` hoặc `docs/backlog/`

**Pros:**
- Tập trung một chỗ
- Dễ tìm

**Cons:**
- **Vi phạm** rule "không tạo top-level folder mới trong docs/ nếu chưa có lý do rõ"
- **Duplicate** với roadmap + plans/ hiện có
- Tạo thêm fragmentation thay vì giảm

### Option C: Dùng `docs/requirements/README.md` `## Deferred` làm single source

**Pros:**
- Đã có sẵn section
- Đúng canonical layer (requirement)

**Cons:**
- `Deferred` chỉ hợp cho feature-level, không hợp cho technical debt, gotchas, architecture notes
- Không đáp ứng "việc sẽ làm" với timeline — chỉ là danh sách tĩnh

---

## Implementation Recommendations

### Phase 1: Tạo 2 file mandated (ưu tiên cao)

#### `docs/development-roadmap.md`

Template đề xuất:

```markdown
# Development Roadmap

_Cập nhật: YYYY-MM-DD._

## Hiện tại: v1.0 MVP

**Focus:** Flow audit CP1 end-to-end (student → admin → supporter)

### Đã hoàn thành
- [x] F01 Structured intake and case submission
- [x] F02 User case workspace and document board
- ...

### Đang làm
- [ ] ...

## Kế tiếp: v1.1

### Sẽ làm
- [ ] Feature X — lý do business
- [ ] Technical debt Y — impact

### Cân nhắc (chưa quyết định)
- [ ] Feature Z — cần thêm research

## Tương lai xa (v2+)

- [ ] Multi-tenant organizations
- [ ] ...

## Quyết định khóa

| Ngày | Quyết định | Lý do |
|------|-----------|-------|
| ... | ... | ... |
```

#### `docs/project-changelog.md`

Template đề xuất (theo Keep a Changelog + Semantic Versioning):

```markdown
# Project Changelog

All notable changes to Nexus Platform. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-21

### Added
- F01: Structured intake and case submission
- F02: User case workspace and document board
- ...
```

### Phase 2: Bổ sung section vào project-context.md

Thêm section cuối file:

```markdown
## Công việc tương lai & Lưu ý (Future Work & Notes)

### Sẽ làm (Planned)
- Item — business reason — priority (High/Medium/Low)

### Nên cân nhắc (Should Consider)
- Item — rationale — cần thêm research

### Lưu ý kỹ thuật (Technical Notes to Remember)
- Context: mô tả vấn đề đã gặp hoặc dự đoán sẽ gặp
- Gotcha: cạm bẫy cần tránh khi implement feature X
- Dependency note: thư viện Y sẽ deprecated, cần migrate trước version Z
```

### Phase 3: Chuẩn hóa các nguồn hiện có

1. **Inline ⚠️ notes** (`deploy-log.md`, `system-architecture.md`): migrate các "verification debt" sang roadmap hoặc project-context
2. **Journal Next Steps**: sau khi feature shipped, nếu còn action item → chuyển vào roadmap, không để trong journal
3. **Requirements Deferred**: giữ lại cho feature-level, link tới roadmap
4. **Plans/ phase files**: giữ cho active execution, sau khi done → update roadmap + changelog

### Trigger update tự động

Dựa trên `.agents/rules/documentation-management.md`:

| Sự kiện | Update file nào |
|---------|----------------|
| Feature implemented | roadmap (đánh dấu done) + changelog (Added) |
| Bug fix | changelog (Fixed) |
| Security patch | changelog (Security) |
| New idea / suggestion | project-context → Future Work |
| Gotcha phát hiện khi dev | project-context → Lưu ý kỹ thuật |
| Milestone đạt được | roadmap (update progress) |
| Weekly review | roadmap (update %) |

---

## Quyết định cuối cùng: `docs/backlog/` (đã triển khai 2026-08-06)

Thay vì dồn tất cả vào 1 file hoặc tạo roadmap/changelog ngay, chọn `docs/backlog/`:
- **1 file / 1 ý tưởng** — mỗi item có context + decisions + notes + gotchas riêng
- **Status flow:** Draft → Researching → Planned → In Progress → Done → Archive
- **Phân biệt rõ với `plans/`**: backlog = capture ý tưởng, plans = execution
- **Update `docs/README.md` + `docs/AGENTS.md`** để AI agent biết backlog/ tồn tại

### Đã triển khai

1. [x] Tạo `docs/backlog/README.md` — rules, index, phân biệt với plans/requirements
2. [x] Tạo `docs/backlog/_template.md` — template cho item mới
3. [x] Tạo item đầu tiên: `credit-du-tru-account-level.md`
4. [x] Cập nhật `docs/README.md` — thêm backlog/ vào canonical + reading order
5. [x] Cập nhật `docs/AGENTS.md` — thêm backlog/ rules cho AI agent

### Còn lại (ưu tiên thấp hơn)

1. **[ ] Tạo `docs/development-roadmap.md`** — điền các milestone đã hoàn thành
2. **[ ] Tạo `docs/project-changelog.md`** — viết changelog v1.0.0
3. **[ ] Migrate các inline ⚠️ notes** từ `system-architecture.md` + `deploy-log.md` vào backlog items

---

## Resources & References

- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — standard cho changelog format
- [Semantic Versioning](https://semver.org/) — versioning convention
- `.agents/rules/documentation-management.md` — agent rules cho roadmap/changelog update
- `docs/ai-rules/documentation-rules.md` — quy tắc tạo/sửa documentation

---

## Unresolved Questions

- Có nên migrate research từ `plans/reports/` sang `docs/research/` để có single research home? (hiện tại research bị split-brain giữa 2 nơi)
- Journal naming convention: chọn `YYMMDD-HHMM` hay `YYYY-MM-DD`? (hiện tại inconsistent)
