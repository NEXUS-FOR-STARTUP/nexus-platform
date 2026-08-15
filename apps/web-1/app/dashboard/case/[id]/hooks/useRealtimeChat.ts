import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import type { Centrifuge } from "centrifuge";
import { UnauthorizedError } from "centrifuge";
import { getCentrifugeClient } from "@/lib/realtime/centrifuge-client";
import type { CaseMessage } from "@/types";

const TOKEN_API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function useRealtimeChat(caseId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const subRef = useRef<ReturnType<Centrifuge["newSubscription"]> | null>(null);

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
      const data = ctx.data as { type?: string; message?: CaseMessage };
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
      if (data?.type !== "message" || !data.message?.id) return;
      queryClient.setQueryData<CaseMessage[]>(["case-messages", caseId], (old = []) => {
        if (old.some((m) => m.id === data.message!.id)) return old;
        return [...old, data.message!].sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        );
      });
    });

    sub.subscribe();
    subRef.current = sub;

    return () => {
      sub.removeAllListeners();
      sub.unsubscribe();
      client.removeSubscription(sub);
      subRef.current = null;
    };
  }, [caseId, queryClient, router]);
}
