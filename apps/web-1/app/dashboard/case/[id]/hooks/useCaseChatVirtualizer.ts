import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CaseMessage } from "@/types";

const PRELOAD_THRESHOLD = 5;
const DIVIDER_ESTIMATE = 48;

export type ChatRow =
  | { kind: "divider"; label: string }
  | { kind: "message"; msg: CaseMessage; isFirstInGroup: boolean };

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function flattenRows(messages: CaseMessage[]): ChatRow[] {
  const result: ChatRow[] = [];
  let lastLabel: string | null = null;
  let lastSenderId: string | null | undefined = undefined;

  for (const msg of messages) {
    const label = formatDateLabel(msg.created_at);
    const isNewDay = label !== lastLabel;

    if (isNewDay) {
      result.push({ kind: "divider", label });
      lastLabel = label;
      lastSenderId = undefined;
    }

    const isFirstInGroup = isNewDay || msg.sender_auth_user_id !== lastSenderId;
    lastSenderId = msg.sender_auth_user_id;

    result.push({ kind: "message", msg, isFirstInGroup });
  }
  return result;
}

export interface UseCaseChatVirtualizerOptions {
  hasPreviousPage: boolean;
  isFetchingPreviousPage: boolean;
  fetchPreviousPage: () => void;
}

export function useCaseChatVirtualizer(
  messages: CaseMessage[],
  { hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage }: UseCaseChatVirtualizerOptions,
  currentUserId?: string,
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => flattenRows(messages), [messages]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (row.kind === "divider") return DIVIDER_ESTIMATE;
      const lineCount = row.msg.content?.split("\n").length ?? 1;
      const isMe = currentUserId ? row.msg.sender_auth_user_id === currentUserId : false;
      const headerH = row.isFirstInGroup && !isMe ? 20 : 0;
      return Math.max(30, 26 + headerH + lineCount * 18);
    },
  });

  // Scroll xuống cuối khi tin cuối thay đổi hoặc khi khởi tạo
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  // Chặn preload trang cũ cho tới khi scroll-to-bottom khởi tạo xong — nếu không,
  // anchor restore sau prepend sẽ ghim scroll giữa danh sách khi vào tab chat.
  const initialScrollDoneRef = useRef(false);
  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id;
    if (lastId === undefined || lastMessageIdRef.current === lastId) return;
    const isFirst = lastMessageIdRef.current === undefined;
    lastMessageIdRef.current = lastId;

    if (isFirst) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(rows.length - 1, { align: "end", behavior: "auto" });
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
          initialScrollDoneRef.current = true;
        }, 50);
      });
    } else {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(rows.length - 1, { align: "end", behavior: "smooth" });
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      });
    }
  }, [messages, rows.length, virtualizer]);

  // Khi viewport chạm gần đầu danh sách → fetch trang cũ hơn + ghi lại anchor scroll.
  // restorePending chặn re-fetch khi virtualizer.range còn stale (startIndex ≤ 5) trong
  // commit vừa prepend — nếu không sẽ cascade load hết mọi trang.
  const anchorRef = useRef<{ messageId: string; offset: number } | null>(null);
  const restorePendingRef = useRef(false);
  useEffect(() => {
    const range = virtualizer.range;
    if (!range || !initialScrollDoneRef.current || !hasPreviousPage || isFetchingPreviousPage || restorePendingRef.current) return;
    if (range.startIndex <= PRELOAD_THRESHOLD) {
      const el = scrollRef.current;
      const anchorItem = virtualizer
        .getVirtualItems()
        .find((vItem) => rows[vItem.index]?.kind === "message");
      if (el && anchorItem) {
        const row = rows[anchorItem.index];
        if (row && row.kind === "message") {
          anchorRef.current = { messageId: row.msg.id, offset: anchorItem.start - el.scrollTop };
        }
      }
      restorePendingRef.current = true;
      fetchPreviousPage();
    }
  }, [virtualizer.range, virtualizer, rows, hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  // Sau khi trang cũ được prepend: giữ nguyên vị trí đang đọc (bù đúng chiều cao thêm vào)
  const messageCount = messages.length;
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchorRef.current = null;
    requestAnimationFrame(() => {
      virtualizer.measure();
      restorePendingRef.current = false;
      const idx = rows.findIndex((r) => r.kind === "message" && r.msg.id === anchor.messageId);
      const el = scrollRef.current;
      if (idx === -1 || !el) return;
      const result = virtualizer.getOffsetForIndex(idx);
      if (!result) return;
      el.scrollTop = result[0] - anchor.offset;
    });
  }, [messageCount, rows, virtualizer]);

  // Fetch kết thúc mà không có prepend (thất bại) → hủy anchor/pending để lần sau không bù scroll sai.
  // Layout effect (restore) chạy trước passive effect trong cùng commit → anchor thành công vẫn được dùng.
  useEffect(() => {
    if (!isFetchingPreviousPage) {
      anchorRef.current = null;
      restorePendingRef.current = false;
    }
  }, [isFetchingPreviousPage]);

  return { scrollRef, rows, virtualizer };
}
