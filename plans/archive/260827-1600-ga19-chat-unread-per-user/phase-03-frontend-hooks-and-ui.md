# Phase 03 — Frontend Hooks & UI Integration (Item 4: Reconnect Sync)

- **Priority:** P2
- **Status:** completed
- **Effort:** 1.0h
- **Depends:** Phase 02
- **Blocks:** Phase 04

---

## 1. Mục tiêu (Objective)

Tích hợp trạng thái chưa đọc vào giao diện người dùng Next.js (Mantine UI v9 + TanStack Query): thay thế badge tổng tin nhắn thành badge tin nhắn chưa đọc thực tế, 100% Realtime push qua Centrifugo và đặc biệt xử lý **Item 4: Tự động phục hồi đồng bộ khi Mất mạng / Centrifugo Reconnect**.

## 2. Chi tiết Triển khai (Implementation Details)

### 2.1. TanStack Query Hook với Item 4 Reconnect Sync (`useCaseUnreadCount.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useEffect, useRef, useCallback } from "react";
import { getCentrifugeClient } from "@/lib/realtime/centrifuge-client";

export function useCaseUnreadCount(caseId: string) {
  const queryClient = useQueryClient();
  const lastMarkedMessageIdRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ["cases", caseId, "unread-count"],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${caseId}/chat/unread`);
      return res.data as { unread_count: number; last_read_at?: string };
    },
    enabled: Boolean(caseId),
    staleTime: Infinity, // Trạng thái được cập nhật realtime qua Centrifugo push
    refetchOnWindowFocus: true, // Item 4: Tự động đồng bộ lại khi người dùng quay lại tab trình duyệt
  });

  // Item 4: Lắng nghe sự kiện "connected" từ Centrifugo để bù đắp các tin nhắn bị miss khi mất mạng / sleep máy
  useEffect(() => {
    if (!caseId) return;
    const client = getCentrifugeClient();

    const handleConnected = () => {
      void queryClient.invalidateQueries({ queryKey: ["cases", caseId, "unread-count"] });
    };

    client.on("connected", handleConnected);
    return () => {
      client.removeListener("connected", handleConnected);
    };
  }, [caseId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (lastReadMessageId?: string) => {
      // Chống trùng lặp bằng ID: nếu đã đánh dấu tin nhắn này rồi thì bỏ qua
      if (lastReadMessageId && lastMarkedMessageIdRef.current === lastReadMessageId) {
        return;
      }
      lastMarkedMessageIdRef.current = lastReadMessageId ?? null;

      const res = await apiClient.post(`/cases/${caseId}/chat/read`, {
        last_read_message_id: lastReadMessageId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["cases", caseId, "unread-count"], (old: any) => ({
        ...old,
        unread_count: 0,
        last_read_at: new Date().toISOString(),
      }));
    },
  });

  const markAsRead = useCallback(
    async (lastReadMessageId?: string) => {
      try {
        await markAsReadMutation.mutateAsync(lastReadMessageId);
      } catch {}
    },
    [markAsReadMutation]
  );

  return {
    unreadCount: query.data?.unread_count ?? 0,
    isLoading: query.isLoading,
    markAsRead,
  };
}
```

### 2.2. Realtime Stream Integration (`useRealtimeChat.ts`)

```typescript
// Xử lý sự kiện tin nhắn mới từ Centrifugo
if (data?.type === "message" && data.message?.id) {
  const newMsg = data.message;
  const currentUserId = sessionData?.user?.id;
  const isFromOther = newMsg.sender_auth_user_id !== currentUserId;

  // Gắn tin nhắn vào list hiển thị
  queryClient.setQueryData<InfiniteData<CaseMessagesPage>>(["case-messages", caseId], (old) => {
    if (!old?.pages?.length) return old;
    const lastIndex = old.pages.length - 1;
    const last = old.pages[lastIndex];
    if (last.messages.some((m) => m.id === newMsg.id)) return old;
    return {
      ...old,
      pages: [
        ...old.pages.slice(0, lastIndex),
        { ...last, messages: appendMessageAsc(last.messages, newMsg) },
      ],
    };
  });

  // Cập nhật số tin chưa đọc Realtime
  if (isFromOther) {
    if (activeTabRef.current === "discussion") {
      // Đang xem tab chat -> mark as read tức thì
      void markAsRead(newMsg.id);
    } else {
      // Đang ở tab khác -> tăng unread badge tức thì (+1)
      queryClient.setQueryData(["cases", caseId, "unread-count"], (old: any) => ({
        ...old,
        unread_count: (old?.unread_count ?? 0) + 1,
      }));
    }
  }
}

// Xử lý sự kiện chat:read từ Centrifugo (Đồng bộ đa thiết bị)
if (data?.type === "chat:read") {
  if (data.user_id === sessionData?.user?.id) {
    queryClient.setQueryData(["cases", caseId, "unread-count"], (old: any) => ({
      ...old,
      unread_count: 0,
      last_read_at: data.last_read_at,
    }));
  }
}
```

### 2.3. Cập nhật Sidebar và Chuyển tab (`WorkspaceSidebar.tsx` & `page.tsx`)

1. **`WorkspaceSidebar.tsx`:**
   - Thay prop `messageCount` bằng `unreadCount`.
   - Hiển thị badge tròn màu đỏ khi `unreadCount > 0`.
   ```tsx
   {tab.id === "discussion" && unreadCount > 0 && (
     <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[18px] h-[18px]">
       {unreadCount > 99 ? "99+" : unreadCount}
     </span>
   )}
   ```

2. **Chuyển tab trong `page.tsx`:**
   - Khi người dùng bấm tab `discussion`, gọi `markAsRead(latestMsg?.id)`.

## 3. Tiêu chí hoàn thành (Acceptance Criteria)

- [x] 1. Badge tăng số lượng tức thì (0ms) khi có tin mới từ WebSocket.
- [x] 2. Badge biến mất ngay khi người dùng chọn tab "Trao đổi".
- [x] 3. **Kiểm thử Item 4:** Khi tắt mạng hoặc sleep máy rồi kết nối lại, badge tự động cập nhật lại chính xác nhờ `connected` event listener và `refetchOnWindowFocus`.
- [x] 4. Không có bất kỳ timer nhân tạo hay polling định kỳ nào.
