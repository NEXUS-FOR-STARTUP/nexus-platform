import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import type { Centrifuge } from "centrifuge";
import { UnauthorizedError } from "centrifuge";
import { getCentrifugeClient } from "@/lib/realtime/centrifuge-client";
import { useSession } from "@/lib/auth-client";
import type { CaseMessage, CaseMessagesPage } from "@/types";
import type { CaseUnreadCountResponse } from "@repo/validation";
import { appendMessageAsc } from "@/lib/case-message-utils";

const TOKEN_API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface UseRealtimeChatOptions {
  activeTab?: string;
  markAsRead?: (lastReadMessageId?: string) => Promise<void> | void;
}

export function useRealtimeChat(caseId: string, options: UseRealtimeChatOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const subRef = useRef<ReturnType<Centrifuge["newSubscription"]> | null>(null);

  const activeTabRef = useRef(options.activeTab);
  activeTabRef.current = options.activeTab;

  const markAsReadRef = useRef(options.markAsRead);
  markAsReadRef.current = options.markAsRead;
  useEffect(() => {
    if (!caseId) return;
    const client = getCentrifugeClient();
    const channel = `chat:${caseId}`;

    // Guard: StrictMode double-effect + tab switch → no duplicate sub crash
    const existing = client.getSubscription(channel);
    if (existing) {
      subRef.current = existing;
      return;
    }

    const sub = client.newSubscription(channel, {
      getToken: async () => {
        const res = await fetch(
          `${TOKEN_API_BASE}/api/realtime/cases/${encodeURIComponent(caseId)}/subscribe-token`,
          { credentials: "include" },
        );
        if (res.status === 401 || res.status === 403) {
          throw new UnauthorizedError("Không có quyền theo dõi hội thoại");
        }
        if (!res.ok) throw new Error("Lỗi lấy token subscription");
        return (await res.json()).token;
      },
    });

    sub.on("publication", (ctx) => {
      const data = ctx.data as {
        type?: string;
        message?: CaseMessage;
        user_id?: string;
        last_read_at?: string;
        last_read_message_id?: string | null;
      };

      if (data?.type === "case_deleted") {
        notifications.show({
          title: "Hồ sơ đã bị xóa",
          message: "Hồ sơ này không còn tồn tại. Bạn sẽ được chuyển về trang tổng quan.",
          color: "red",
        });
        queryClient.invalidateQueries();
        router.replace("/dashboard");
        return;
      }

      if (data?.type === "chat:read") {
        if (data.user_id === session?.user?.id) {
          queryClient.setQueryData<CaseUnreadCountResponse>(
            ["cases", caseId, "unread-count"],
            () => ({
              unread_count: 0,
              last_read_at: data.last_read_at,
            }),
          );
        }
        return;
      }

      if (data?.type !== "message" || !data.message?.id) return;

      const newMsg = data.message;
      const currentUserId = session?.user?.id;
      const isFromOther = newMsg.sender_auth_user_id !== currentUserId;

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

      if (isFromOther) {
        if (activeTabRef.current === "discussion") {
          if (markAsReadRef.current) {
            void markAsReadRef.current(newMsg.id);
          }
        } else {
          queryClient.setQueryData<CaseUnreadCountResponse>(
            ["cases", caseId, "unread-count"],
            (old: CaseUnreadCountResponse | undefined) => ({
              unread_count: (old?.unread_count ?? 0) + 1,
              last_read_at: old?.last_read_at,
            }),
          );
        }
      }
    });
    sub.subscribe();
    subRef.current = sub;

    return () => {
      sub.removeAllListeners();
      sub.unsubscribe();
      client.removeSubscription(sub);
      subRef.current = null;
    };
  }, [caseId, queryClient, router, session?.user?.id]);
}
