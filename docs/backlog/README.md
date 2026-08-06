# Backlog

Danh sách structured các việc sẽ làm, nên làm, và lưu ý cho tương lai.

## Mục đích

Backlog là nơi capture 3 loại thông tin:

1. **Sẽ làm (Planned)** — việc đã có định hướng, sẽ triển khai khi đủ resources
2. **Nên làm (Should Consider)** — đề xuất cần thêm nghiên cứu hoặc quyết định
3. **Lưu ý (Notes/Gotchas)** — context, quyết định, cạm bẫy cần nhớ khi implement

## Phân biệt với các nơi khác

|              | `docs/backlog/`                                    | `plans/`                 | `docs/requirements/`          | `docs/project-context.md`  |
| ------------ | -------------------------------------------------- | ------------------------ | ----------------------------- | -------------------------- |
| Mục đích     | Capture ý tưởng + context + decisions + notes      | Execution plan đang chạy | Feature requirement canonical | Business context canonical |
| Trạng thái   | Draft → Researching → Planned → In Progress → Done | Active → Done            | Finalized                     | Living document            |
| Khi nào dùng | "Có ý tưởng, ghi lại kẻo quên"                     | "Bắt tay implement"      | "Đã chốt requirement"         | "Business context"         |

## Flow

1. **Nảy ra ý tưởng** → tạo file trong `backlog/`, status = `Draft`
2. **Cần research** → `docs/research/`, update status = `Researching`
3. **Chốt plan** → `plans/<timestamp>-<name>/`, update status = `Planned`
4. **Đang làm** → status = `In Progress`, link tới plan
5. **Xong** → update `docs/project-changelog.md`, move về `docs/archive/backlog/` hoặc giữ lại đánh dấu `Done`

## Trạng thái backlog item

| Status        | Ý nghĩa                                    |
| ------------- | ------------------------------------------ |
| `Draft`       | Mới capture, chưa phân tích kỹ             |
| `Researching` | Đang nghiên cứu (link tới research report) |
| `Planned`     | Đã có plan (link tới plans/)               |
| `In Progress` | Đang triển khai                            |
| `Done`        | Hoàn thành → move archive                  |
| `Deferred`    | Tạm hoãn, sẽ xem lại sau                   |
| `Rejected`    | Đã cân nhắc, không làm                     |

## File index

| File                                                               | Status | Priority | Mô tả ngắn                                 |
| ------------------------------------------------------------------ | ------ | -------- | ------------------------------------------ |
| [credit-du-tru-account-level.md](./credit-du-tru-account-level.md) | Draft  | Medium   | Credit dự trữ account-level cho lượt audit |

## Quy tắc

1. Mỗi ý tưởng = 1 file, tên file kebab-case mô tả chủ đề.
2. Dùng `_template.md` làm khung cho file mới.
3. Luôn ghi rõ status + priority + ngày tạo.
4. Nếu thiếu dữ liệu, gán nhãn `Missing`, `Unclear`, `Needs decision`, `Assumption`.
5. Không duplicate nội dung với `requirements/` hoặc `plans/` — link về canonical.
6. Sau khi done, review xem có cần giữ lại làm reference không. Nếu không → archive.
