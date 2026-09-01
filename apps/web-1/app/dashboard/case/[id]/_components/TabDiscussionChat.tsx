"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCaseChat } from "../hooks/useCaseChat";
import { useCaseUnreadCount } from "../hooks/useCaseUnreadCount";
import { useCaseChatVirtualizer } from "../hooks/useCaseChatVirtualizer";
import { useSession } from "@/lib/auth-client";
import { ArrowUp, MessageSquare, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { ActionIcon, Textarea, Tooltip, Alert } from "@mantine/core";

interface TabDiscussionChatProps {
  caseId: string;
}

/* ─── Helpers ─────────────────────────────────────────────── */
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avatarHue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function getRoleBadge(role?: string) {
  if (role === "admin")
    return {
      label: "Admin",
      cls: "bg-red-50 text-red-600 border border-red-200/60 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40",
    };
  if (role === "supporter")
    return {
      label: "Supporter",
      cls: "bg-blue-50 text-blue-600 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
    };
  return {
    label: "Sinh viên",
    cls: "bg-slate-100 text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60",
  };
}

/* ─── Chat gate error (D16) ───────────────────────────────── */
interface ChatGateError {
  code: "CHAT_FREE_TIER" | "CHAT_REJECTED" | "CHAT_CLOSED" | "CHAT_LOCKED";
  unlockInMs?: number;
}

function extractChatGateError(error: unknown): ChatGateError | null {
  if (!error || typeof error !== "object") return null;
  const err = error as {
    response?: { data?: { code?: string; details?: { unlockInMs?: number } } };
  };
  const code = err.response?.data?.code;
  if (
    code === "CHAT_FREE_TIER" ||
    code === "CHAT_REJECTED" ||
    code === "CHAT_CLOSED" ||
    code === "CHAT_LOCKED"
  ) {
    return { code, unlockInMs: err.response?.data?.details?.unlockInMs };
  }
  return null;
}
/* ─── Component ─────────────────────────────────────────────── */
export default function TabDiscussionChat({ caseId }: TabDiscussionChatProps) {
  const { data: session } = useSession();
  const { markAsRead } = useCaseUnreadCount(caseId);
  const {
    messages, isLoading, isFetching, error, refetch, sendMessage, isSending, sendError,
    hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage,
  } = useCaseChat(caseId);
  useEffect(() => {
    if (messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      void markAsRead(latestMsg.id);
    }
  }, [messages, markAsRead]);
  const { scrollRef, rows, virtualizer } = useCaseChatVirtualizer(messages, {
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
  });

  const chatGate = useMemo(() => extractChatGateError(sendError), [sendError]);
  const isChatClosed =
    chatGate?.code === "CHAT_FREE_TIER" ||
    chatGate?.code === "CHAT_REJECTED" ||
    chatGate?.code === "CHAT_CLOSED";
  const isChatLocked = chatGate?.code === "CHAT_LOCKED";
  const isChatBlocked = isChatClosed || isChatLocked;

  const [inputText, setInputText] = useState("");
  const [isMultiLine, setIsMultiLine] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);


  /* track textarea rows for input border-radius */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const check = () => setIsMultiLine(el.rows > 1);
    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();
    return () => observer.disconnect();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    try {
      await sendMessage(inputText.trim());
      setInputText("");
    } catch {}
  };

  const isMyMessage = (msg: { sender_auth_user_id?: string | null }) => msg.sender_auth_user_id === session?.user?.id;

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border-app animate-fade-in h-full flex-1 min-h-0"
      style={{
        background: "var(--color-surface-app)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border-app shrink-0"
        style={{ background: "var(--color-surface-soft)" }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand" />
          <span className="text-[13px] font-semibold text-text-app tracking-wide">Trao đổi</span>
        </div>

        <Tooltip label="Tải tin nhắn mới" position="left" withArrow>
          <ActionIcon
            size={28}
            radius="md"
            variant="subtle"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-brand" : "text-text-muted"}`}
            />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* ── Virtualised message list ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 px-5 py-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-brand-soft)" }}
            >
              <MessageSquare className="w-5 h-5 text-brand" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-text-app mb-0.5">Chưa có trao đổi nào</p>
              <p className="text-[13px] text-text-muted max-w-[280px] leading-relaxed">
                Đây là nơi nhóm và Supporter phối hợp trong suốt quá trình phản biện.
              </p>
            </div>
          </div>
        ) : (
          /* Virtual container — fixed height = total virtual size */
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((vItem) => {
              const row = rows[vItem.index];

              return (
                <div
                  key={vItem.key}
                  data-index={vItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${vItem.start}px)`,
                    paddingBottom: row.kind === "divider" ? "8px" : row.isFirstInGroup ? "6px" : "3px",
                  }}
                >
                  {row.kind === "divider" ? (
                    /* ── Date divider ── */
                    <div className="flex items-center justify-center gap-3 pt-3.5 pb-2 select-none">
                      <div className="flex-1 max-w-[120px] sm:max-w-[180px] h-px opacity-60" style={{ background: "var(--color-border)" }} />
                      <span
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-md shrink-0 shadow-2xs"
                        style={{
                          background: "var(--color-surface-muted)",
                          color: "var(--color-text-subtle)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {row.label}
                      </span>
                      <div className="flex-1 max-w-[120px] sm:max-w-[180px] h-px opacity-60" style={{ background: "var(--color-border)" }} />
                    </div>
                  ) : (
                    /* ── Message bubble ── */
                    (() => {
                      const msg = row.msg;
                      const isMe = isMyMessage(msg);
                      const senderName = msg.sender?.name || "Người dùng";
                      const role = msg.sender?.role;
                      const badge = getRoleBadge(role);
                      const hue = avatarHue(msg.sender_auth_user_id || msg.id);
                      const initials = getInitials(senderName);
                      const isShort = (msg.content?.length ?? 0) <= 28 && !msg.content?.includes("\n");
                      const showHeader = !isMe && row.isFirstInGroup;

                      return (
                        <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`flex gap-2 max-w-[82%] sm:max-w-[72%] ${isMe ? "justify-end" : "items-start"}`}>
                            {/* Avatar (only for incoming messages) */}
                            {!isMe && (
                              showHeader ? (
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 select-none shadow-xs mt-0.5"
                                  style={{ background: `hsl(${hue} 60% 45%)` }}
                                >
                                  {initials}
                                </div>
                              ) : (
                                <div className="w-7 shrink-0" aria-hidden="true" />
                              )
                            )}

                            {/* Bubble group */}
                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                              {/* Sender + badge (only for first message in group) */}
                              {showHeader && (
                                <div className="flex items-center gap-1.5 mb-0.5 px-0.5">
                                  <span className="text-[12px] font-semibold text-text-app">
                                    {senderName}
                                  </span>
                                  <span
                                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                              )}

                              {/* Bubble */}
                              <div
                                className={`relative px-2.5 py-1.5 text-[13px] leading-snug break-words w-fit ${
                                  isMe
                                    ? "rounded-lg rounded-tr-xs text-white"
                                    : "rounded-lg rounded-tl-xs text-text-app"
                                }`}
                                style={
                                  isMe
                                    ? {
                                        background: "var(--color-brand)",
                                        boxShadow: "0 1px 2px rgba(37,99,235,0.2)",
                                        maxWidth: "min(380px, 75vw)",
                                      }
                                    : {
                                        background: "var(--color-surface-soft)",
                                        border: "1px solid var(--color-border)",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                        maxWidth: "min(380px, 75vw)",
                                      }
                                }
                              >
                                {isShort ? (
                                  <div className="flex items-baseline gap-2">
                                    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                      {msg.content}
                                    </span>
                                    <span
                                      className={`text-[9px] shrink-0 select-none tabular-nums ${
                                        isMe ? "text-white/75" : "text-text-subtle"
                                      }`}
                                    >
                                      {formatTime(msg.created_at)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                      {msg.content}
                                    </p>
                                    <span
                                      className={`text-[9px] mt-0.5 select-none leading-none self-end tabular-nums ${
                                        isMe ? "text-white/75" : "text-text-subtle"
                                      }`}
                                    >
                                      {formatTime(msg.created_at)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Error bar ── */}
      {error && (
        <div
          className="px-4 py-2 flex items-center gap-2 text-[13px] shrink-0"
          style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{(error as Error)?.message || String(error)}</span>
        </div>
      )}

      {/* ── Input area ── */}
      <div
        className="shrink-0 px-4 py-4 border-t border-border-app"
        style={{ background: "var(--color-surface-soft)" }}
      >
        <form onSubmit={handleSend}>
          <div
            className={`flex items-end gap-2 border border-border-strong bg-surface-app px-4 py-2.5 transition-colors ${isMultiLine ? "rounded-xl" : "rounded-lg"}`}
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <Textarea
              ref={inputRef}
              aria-label="Nhập nội dung tin nhắn"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isChatBlocked}
              placeholder={isChatClosed ? "Chat hiện không khả dụng" : isChatLocked ? "Hết lượt kiểm tra và ân hạn. Vui lòng nạp thêm credit." : "Nhắn gì đó…"}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              minRows={1}
              maxRows={5}
              autosize
              styles={{
                input: {
                  background: "transparent",
                  border: "none",
                  lineHeight: "1.5",
                  fontSize: "14px",
                  padding: "6px 0",
                  minHeight: "26px",
                },
                wrapper: {
                  flex: 1,
                },
              }}
            />

            {/* Send */}
            <ActionIcon
              type="submit"
              disabled={!inputText.trim() || isSending}
              size={36}
              radius="md"
              color="brand"
              className="shrink-0 cursor-pointer"
              style={{
                background:
                  inputText.trim() && !isSending ? "var(--color-brand)" : undefined,
                boxShadow:
                  inputText.trim() && !isSending
                    ? "0 2px 8px rgba(37,99,235,0.35)"
                    : undefined,
                transition: "all 0.15s ease",
              }}
            >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4.5 h-4.5" />
            )}
            </ActionIcon>
          </div>
        </form>

        {isChatClosed && (
          <Alert color="red" variant="light" radius="md" className="mt-2">
            <div className="flex items-center gap-2 text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Chat hiện không khả dụng. Vui lòng liên hệ qua email hoặc điện thoại.</span>
            </div>
          </Alert>
        )}

        {isChatLocked && (
          <Alert color="yellow" variant="light" radius="md" className="mt-2">
            <div className="flex items-center gap-2 text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Hết lượt kiểm tra và đã qua thời gian ân hạn 24h. Vui lòng mua thêm credit để tiếp tục trao đổi.
              </span>
            </div>
          </Alert>
        )}

        
      </div>
    </div>
  );
}
