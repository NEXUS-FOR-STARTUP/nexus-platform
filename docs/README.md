# Nexus docs

`docs/` dùng business-first, PRD-led.

Trục chính: `project-context -> PRD -> flows -> requirements -> technical-notes -> archive`

## Focus hiện tại

Canonical đang chốt MVP cho flow `audit + review CP1` — workflow `student -> admin -> supporter` xoay quanh `Hồ sơ phản biện`, `Tài liệu minh chứng`, `Báo cáo phản biện`, các vòng sửa trong case workspace.

Giá trị chính:
- biết tài liệu/hướng làm yếu ở đâu
- biết sửa gì trước
- nhận report rõ ràng
- gửi bản sửa để review lại
- theo dõi trao đổi, tài liệu, tiến độ trong cùng workspace

`Case management` chỉ là lớp vận hành hỗ trợ value flow đó.

## Nguồn chuẩn

- [`project-context.md`](./project-context.md): business context canonical, core value flow vs ops flow, target customer, constraints
- [`project-overview-pdr.md`](./project-overview-pdr.md): canonical ngắn cho MVP demo realignment, student -> admin -> supporter workflow
- [`prd/core-product-prd.md`](./prd/core-product-prd.md): product scope canonical, MVP scope, feature list, screen inventory
- [`flows/`](./flows/): user flow, operational flow, round flow, screen-level journey, UX spec cho MVP
- [`requirements/`](./requirements/): functional requirement canonical, user story, acceptance criteria, business rules
- [`technical-notes/`](./technical-notes/): technical note tối thiểu, route map + component map cho frontend MVP
- [`backlog/`](./backlog/): structured future work — việc sẽ làm, nên làm, lưu ý cho tương lai (Draft → Researching → Planned → In Progress → Done)
- [`archive/`](./archive/): legacy reference, spec cũ, deferred docs

## Thứ tự đọc

1. `project-context.md`
2. `project-overview-pdr.md`
3. `prd/core-product-prd.md`
4. `system-architecture.md`
5. `flows/cp1-audit-end-to-end-flow.md`
6. `flows/cp1-mvp-screen-spec.md`
7. `technical-notes/frontend-route-and-component-map.md`
8. [`backlog/`](./backlog/) — việc sẽ làm, nên làm, lưu ý tương lai
9. flow liên quan trong `flows/`
10. requirement liên quan trong `requirements/`
11. note liên quan trong `technical-notes/`
12. `archive/` khi cần legacy/deferred scope

## Tài liệu hỗ trợ

- [`codebase-summary.md`](./codebase-summary.md): tóm tắt codebase, verified implementation surfaces cho MVP
- [`code-standards.md`](./code-standards.md): chuẩn code, guardrails cho MVP demo realignment
- [`system-architecture.md`](./system-architecture.md): architecture hiện trạng, document workspace, payment surface, shared shell
- [`tech-doc-urls.txt`](./tech-doc-urls.txt): nguồn docs ngoài cho library/framework

## Tài liệu vận hành

- [`db-query-guide.md`](./db-query-guide.md): hướng dẫn truy vấn DB an toàn qua READONLY_DATABASE_URL
- [`db-backup-guide.md`](./db-backup-guide.md): hướng dẫn backup DB (pg_dump via Docker)
- [`db-migration-guide.md`](./db-migration-guide.md): hướng dẫn migration Prisma
- [`docker-build-push-guide.md`](./docker-build-push-guide.md): hướng dẫn build/push Docker image
- [`ci-guide.md`](./ci-guide.md): hướng dẫn CI/CD với GitHub Actions
- [`realtime-centrifugo-guide.md`](./realtime-centrifugo-guide.md): vận hành & troubleshooting realtime chat Centrifugo
- [`deploy-log.md`](./deploy-log.md): log các lần deploy image lên Docker Hub (commit/branch/message)

## Tài liệu nguồn — `nexus-document/`

[`nexus-document/`](./nexus-document/) chứa **tài liệu gốc của dự án Nexus** — bài nộp checkpoint, biên bản mentoring, phản hồi giảng viên, tài liệu hướng dẫn và vận hành thủ công.

**Khác biệt với `docs/` chính:**

| `docs/` (product docs) | `nexus-document/` (source materials) |
|------------------------|--------------------------------------|
| PRD, requirements, flows, technical notes | Bài nộp CP1–CP4, script thuyết trình |
| Dùng để implement sản phẩm | Dùng để tra cứu ngữ cảnh business |
| Canonical, luôn được cập nhật | Cố định theo từng checkpoint |
| Hướng đến dev team | Hướng đến người cần hiểu business gốc |

**Khi nào dùng `nexus-document/`?**
- Cần hiểu business context gốc (bài nộp thật, feedback thật)
- Cần tham khảo số liệu phỏng vấn, TAM/SAM/SOM
- Cần xem phản hồi giảng viên cho từng CP
- Cần biết quy trình vận hành thủ công (concierge MVP)

**Khi nào dùng `docs/` chính?**
- Cần implement tính năng
- Cần hiểu requirement, flow, architecture
- Cần technical spec

Bắt đầu từ [`nexus-document/structure-map.md`](./nexus-document/structure-map.md) để xem cây thư mục đầy đủ.

## Quy tắc

1. Cập nhật file canonical trước.
2. Không duplicate định nghĩa ở nhiều file.
3. Không viết technical note trước khi business context và product scope rõ.
4. Nếu thiếu dữ liệu, ghi `Missing`, `Unclear`, `Needs decision`, `Assumption`.
5. Không dùng `archive/` làm source of truth.
