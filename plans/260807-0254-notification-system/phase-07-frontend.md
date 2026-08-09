# Phase 07 — Frontend (Bell + Hook + Dropdown)

**Effort:** 3.5h

## Việc

Notification bell trong DashboardShell (dùng chung 3 role). TanStack Query + EventSource. Tiếng Việt, Lucide, Mantine — theo `apps/web-1/AGENTS.md`.

## Files

### 1. `apps/web-1/types/notification.ts`

```ts
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}
```

### 2. `apps/web-1/lib/hooks/useNotifications.ts` (shared 3 role — KHÔNG đặt trong `app/<route>/hooks/`)

> **Project structure (audit 2026-08-07):** convention hook theo route group: `app/dashboard/hooks/`, `app/admin/hooks/`... Shared code xuyên route đặt trong `apps/web-1/lib/` (api-client.ts, auth-client.ts, event-details.ts). Folder `hooks/` cấp cao KHÔNG tồn tại — hook dùng chung 3 role đặt `lib/hooks/`

```ts
const SSE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/notifications/stream`;

export function useNotifications() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await apiClient.get("/notifications?page=1&limit=20")).data.items,
    refetchOnWindowFocus: false,
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await apiClient.get("/notifications/unread-count")).data.count,
    refetchInterval: 60_000,   // polling phụ — SSE mất vẫn cập nhật
    refetchOnWindowFocus: false,
  });

  // SSE — ping → refetch cả 2
  useEffect(() => {
    const es = new EventSource(SSE_URL, { withCredentials: true });
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    es.onopen = refresh;            // reconnect thành công → sync lại
    es.onmessage = (e) => {
      if (e.data === "hb") return;  // heartbeat — ignore
      refresh();
    };
    es.onerror = () => { /* EventSource tự reconnect; refetch khi onopen */ };
    // SECURITY (audit 2026-08-07): session hết hạn/ban → REST trả 401 → đóng SSE, không nhận thêm ping
    const stopOnUnauthorized = () => {
      const q = queryClient.getQueryState(["notifications"]);
      if (q?.status === "error" && (q.error as { response?: { status?: number } })?.response?.status === 401) es.close();
    };
    const origOnOpen = es.onopen;
    es.onopen = (e) => { refresh(); stopOnUnauthorized(); };
    return () => es.close();
  }, [queryClient]);

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); },
  });
  const markAllRead = useMutation({
    mutationFn: () => apiClient.patch("/notifications/read-all"),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); },
  });

  return { listQuery, unreadQuery, markRead, markAllRead };
}
```

apiClient tự thêm Idempotency-Key cho POST/PATCH — không sao, idempotent.

### 3. `apps/web-1/components/layout/NotificationBell.tsx`

- **Mantine:** `Menu`, `ActionIcon`, `Badge`, `ScrollArea`, `Divider`, `Button`
- **Icon:** `Bell`, `CheckCheck` (lucide-react)
- **Cấu trúc:**
  - `Menu.Target` → ActionIcon Bell + Badge (unreadCount > 0 → hiện số, giới hạn "99+")
  - `Menu.Dropdown` width ~360: header "Thông báo" + nút "Đánh dấu tất cả đã đọc"
  - List 20 item: title (semibold), body (muted, 2 dòng truncate), thời gian relative (`dayjs` — dep có sẵn)
  - Chưa đọc: nền `bg-brand-soft/30` + chấm brand bên trái
  - Click item → `markRead.mutate(id)` + `router.push(link)` (link nội bộ)
  - Rỗng → empty state "Không có thông báo"
- **KHÔNG** tailwind positioning classes trên Mantine components (luật web-1)
- Badge đếm: wrapper div relative + Badge `style={{ position: "absolute", top: 0, right: 0 }}` (style prop Mantine cho phép)

### 4. Mount — `apps/web-1/components/layout/DashboardShell.tsx`

- L84-85: thêm `<NotificationBell />` TRƯỚC `<ThemeToggler />`
- Không sửa layout files (3 layout đều render DashboardShell)

## Verify

- [ ] `npm run check-types --workspace=apps/web-1` pass
- [ ] `npm run lint` pass
- [ ] Assign supporter → badge đổi <3s không refresh
- [ ] Click → đúng trang + mark read → badge giảm
- [ ] Dark mode OK
- [ ] Đổi tab → reconnect không crash

## Chốt

- 3 role thấy bell, badge đúng
- Click → đúng deep link theo role
- SSE mất → polling 60s vẫn cập nhật
