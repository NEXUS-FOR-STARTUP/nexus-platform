# Phase 4: TanStack Query Hook & Giao diện Frontend Admin Hub

**Tập tin mục tiêu:**
1. `apps/web-1/app/admin/hooks/useAdminWorkers.ts`
2. `apps/web-1/app/admin/_components/WorkerKpiCards.tsx`
3. `apps/web-1/app/admin/_components/WorkerJobsTable.tsx`
4. `apps/web-1/app/admin/_components/WorkerJobDetailDrawer.tsx`
5. `apps/web-1/app/admin/_components/RetryJobModal.tsx`
6. `apps/web-1/app/admin/_components/HealStuckJobModal.tsx`
7. `apps/web-1/app/admin/_components/AdminWorkerMonitoring.tsx`
8. `apps/web-1/app/admin/page.tsx`

---

## 1. Custom Hook `useAdminWorkers.ts`

Tạo `apps/web-1/app/admin/hooks/useAdminWorkers.ts` sử dụng TanStack Query v5:
- `useAdminWorkerStats()`:
  - Query key: `["admin-worker-stats"]`
  - Polling thông minh: 5000ms nếu `activeCount > 0` hoặc `stuckCount > 0`, ngược lại 15000ms.
- `useAdminWorkerJobs(params)`:
  - Query key: `["admin-worker-jobs", params]`
  - Hỗ trợ `page`, `limit`, `status`, `search` (debounced 300ms).
- `useAdminWorkerJobDetail(jobId)`:
  - Query key: `["admin-worker-job", jobId]`
  - `enabled: !!jobId`
- `useAdminWorkerLogs(jobId, enabled)`:
  - Query key: `["admin-worker-logs", jobId]`
  - `refetchInterval: 3000ms` khi job đang running.
- Mutations:
  - `useRetryWorkerJob`: Gọi `POST /admin/workers/jobs/:id/retry`. On success: invalidate `admin-worker-jobs` và `admin-worker-stats`.
  - `useHealStuckJob`: Gọi `POST /admin/workers/jobs/:id/heal-stuck`. On success: notification Mantine màu xanh.
  - `useCancelWorkerJob`: Gọi `POST /admin/workers/jobs/:id/cancel`.

---

## 2. Các Components Giao diện (Mantine UI v9 + Lucide React)

Tuân thủ nghiêm ngặt:
- Không dùng emoji làm icon; 100% icon từ `lucide-react`.
- Không thêm Tailwind positioning classes (`fixed`, `inset-0`, `flex`, `items-center`) vào Mantine `Modal` hay `Drawer`.
- Không dùng `shadow-sm`, `shadow-md` trên Mantine `Paper` hay `Card`.
- Giới hạn độ dài file dưới 200 dòng (chia nhỏ thành các component con).

### 2.1. `WorkerKpiCards.tsx`
4 thẻ chỉ số bằng `Paper` với viền `border-border-app`:
1. **Đang thực thi**: Số job active / 2 slots, badge xanh dương.
2. **Hàng đợi chờ**: Số job waiting, badge vàng.
3. **Thành công 24h**: Số job completed, thời lượng trung bình.
4. **Cần xử lý / Kẹt**: Số job stuck hoặc failed, viền màu cam nếu > 0.

### 2.2. `WorkerJobsTable.tsx`
- Bảng hiển thị danh sách các job: Mã Case, Tên dự án, Sinh viên, Model AI, Thời gian bắt đầu, Trạng thái (Badge ngữ nghĩa), Thao tác.
- Live counter cho các job đang chạy (`Running: 1m 24s`).
- Badge trạng thái:
  - `Đang chạy`: Blue dot + animation pulse.
  - `Chờ xử lý`: Yellow dot.
  - `Thành công`: Green dot.
  - `Thất bại`: Red dot.
  - `Nghi kẹt`: Violet badge cảnh báo.
- Nút bấm thao tác: Chi tiết (`Eye`), Chạy lại (`RotateCcw`), Giải phóng kẹt (`Wrench`), Hủy (`Square`).

### 2.3. `WorkerJobDetailDrawer.tsx`
Mantine Drawer bên phải (`size="xl"`, 750px) chia làm 4 Tabs:
- **Tab 1: Tổng quan & Milestones**: Stepper 5 bước hiển thị trạng thái từng mốc, host, PID, thời lượng.
- **Tab 2: Dữ liệu đầu vào**: Snapshot ý tưởng đề án, danh sách file nộp với nút tải về.
- **Tab 3: Kết quả đầu ra & Báo cáo**: Điểm số 5 tiêu chí Rubric, nút mở PDF A4, thông tin lỗi `failedReason`.
- **Tab 4: Nhật ký Terminal**: Khung terminal nền đen `#0a0a0a`, font `Fira Code`, nút Auto-scroll, nút Copy logs.

### 2.4. `RetryJobModal.tsx`
Modal xác nhận chạy lại:
- Cho phép chọn model AI:
  - `Google Gemini 2.5 Flash` (Mặc định)
  - `Claude 3.5 Sonnet` (Phân tích sâu)
  - `OpenAI GPT-4o` (Dự phòng quota)
  - `Mimo v2.5` (Tiết kiệm)
  - Tùy chỉnh (Input text tự do)
- Radio chọn Prompt: `Tiêu chuẩn (Full)` hoặc `Tinh gọn (Lite)`.
- Thông báo rõ ràng: *"Thao tác này KHÔNG trừ credit của sinh viên"*.

### 2.5. `HealStuckJobModal.tsx`
Modal xác nhận giải phóng kẹt:
- Cảnh báo force-terminate tiến trình treo.
- Thông báo tự động hoàn 1 credit vào ví hồ sơ nếu sinh viên chưa nhận được báo cáo.

### 2.6. `AdminWorkerMonitoring.tsx`
Component ghép nối các phần tử lại với nhau, nhận prop `filter: "all" | "active" | "waiting" | "stuck" | "failed" | "completed"` từ trang cha.

---

## 3. Tích hợp vào `apps/web-1/app/admin/page.tsx`

1. Bổ sung `"workers"` vào `activeSection`:
```typescript
const [activeSection, setActiveSection] = useState<"payments" | "cases" | "documents" | "packages" | "stats" | "users" | "workers">("stats");
```
2. Thêm icon vào Sidebar `DoubleNavbar`:
```typescript
<Tooltip label="Tiến trình AI" position="right">
  <UnstyledButton
    onClick={() => {
      setActiveSection("workers");
      router.push("/admin?tab=workers");
    }}
    className={classes.mainLink}
    data-active={activeSection === "workers" || undefined}
  >
    <Bot className="w-6 h-6" />
    {activeWorkersCount > 0 && <Badge size="xs" circle color="blue">{activeWorkersCount}</Badge>}
  </UnstyledButton>
</Tooltip>
```
3. Thêm sub-menu bên trái:
- "Tất cả" (`workerFilter = "all"`)
- "Đang chạy" (`workerFilter = "active"`)
- "Trong hàng đợi" (`workerFilter = "waiting"`)
- "Nghi kẹt" (`workerFilter = "stuck"`)
- "Thất bại" (`workerFilter = "failed"`)
- "Đã hoàn thành" (`workerFilter = "completed"`)
4. Render `<AdminWorkerMonitoring filter={workerFilter} />` khi `activeSection === "workers"`.

---

## 4. Tiêu chí Nghiệm thu Phase 4
- [ ] Giao diện hiển thị đúng chuẩn Mantine UI v9, không lỗi hydration Next.js 16.
- [ ] Drawer mở ra mượt mà, đầy đủ 4 tab dữ liệu.
- [ ] Modal Retry cho phép chọn model AI và submit thành công.
- [ ] Typecheck `bun run check-types` vượt qua sạch sẽ.
