"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCaseChat } from "../hooks/useCaseChat";
import { useSession } from "@/lib/auth-client";
import { ArrowUp, MessageSquare, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { ActionIcon, Textarea, Tooltip, Alert } from "@mantine/core";

interface TabDiscussionChatProps {
  caseId: string;
  creditBalance?: number;
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

function avatarHue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function getRoleBadge(role?: string) {
  if (role === "admin")
    return { label: "Admin", cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" };
  if (role === "supporter")
    return { label: "Supporter", cls: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" };
  return { label: "Sinh viên", cls: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" };
}

/* ─── Virtualizer row types ────────────────────────────────── */
type Row =
  | { kind: "divider"; label: string }
  | { kind: "message"; msg: any };

/* ─── Component ─────────────────────────────────────────────── */
export default function TabDiscussionChat({ caseId, creditBalance }: TabDiscussionChatProps) {
  const { data: session } = useSession();
  const { messages, isLoading, isFetching, error, refetch, sendMessage, isSending } =
    useCaseChat(caseId);

  const isLocked = (creditBalance ?? 1) <= 0;
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

  /* scrollable container ref for virtualizer */
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Flatten messages + date dividers into rows ── */
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    let lastLabel: string | null = null;
    for (const msg of messages) {
      const label = formatDateLabel(msg.created_at);
      if (label !== lastLabel) {
        result.push({ kind: "divider", label });
        lastLabel = label;
      }
      result.push({ kind: "message", msg });
    }
    return result;
  }, [messages]);

  /* ── TanStack Virtual ── */
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (row.kind === "divider") return 36;
      // estimate taller for multiline; actual size is measured via measureElement
      const lineCount = (row.msg.content?.split("\n").length ?? 1);
      return Math.max(72, 56 + lineCount * 18);
    },
    overscan: 8,
  });

  /* scroll to bottom whenever messages change */
  useEffect(() => {
    if (rows.length === 0) return;
    // wait one tick so virtualizer measures first
    requestAnimationFrame(() => {
      virtualizer.scrollToIndex(rows.length - 1, { align: "end", behavior: "smooth" });
    });
  }, [rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      await sendMessage(inputText.trim());
      setInputText("");
    } catch {}
  };

  const isMyMessage = (msg: any) => msg.sender_auth_user_id === session?.user?.id;

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border-app animate-fade-in h-full"
      style={{
        background: "var(--color-surface-app)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border-app shrink-0"
        style={{ background: "var(--color-surface-soft)" }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold text-text-app tracking-wide">Trao đổi</span>
          {messages.length > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--color-brand-soft)", color: "var(--color-brand)" }}
            >
              {messages.length}
            </span>
          )}
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
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-brand-soft)" }}
            >
              <MessageSquare className="w-5 h-5 text-brand" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-text-app mb-0.5">Chưa có trao đổi nào</p>
              <p className="text-[11px] text-text-muted max-w-[260px] leading-relaxed">
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
                    paddingBottom: "12px",
                  }}
                >
                  {row.kind === "divider" ? (
                    /* ── Date divider ── */
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                      <span
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "var(--color-surface-muted)",
                          color: "var(--color-text-subtle)",
                        }}
                      >
                        {row.label}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                    </div>
                  ) : (
                    /* ── Message bubble ── */
                    (() => {
                      const msg = row.msg;
                      const isMe = isMyMessage(msg);
                      const senderName = isMe
                        ? (session?.user?.name ?? "Tôi")
                        : (msg.sender?.name || "Người dùng");
                      const displayName = isMe ? "Tôi" : senderName;
                      const role = msg.sender?.role;
                      const badge = getRoleBadge(role);
                      const hue = avatarHue(msg.sender_auth_user_id || msg.id);
                      const initials = getInitials(senderName);

                      return (
                        <div className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-5 select-none"
                            style={{ background: `hsl(${hue} 60% ${isMe ? "45%" : "50%"})` }}
                          >
                            {initials}
                          </div>

                          {/* Bubble group */}
                          <div
                            className={`space-y-1 max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            {/* Sender + badge */}
                            <div className={`flex items-center gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                              <span className="text-[11px] font-semibold text-text-app">
                                {displayName}
                              </span>
                              {!isMe && (
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}
                                >
                                  {badge.label}
                                </span>
                              )}
                            </div>

                            {/* Bubble */}
                            <div
                              className={`relative px-3.5 pt-2.5 pb-2 text-xs leading-relaxed break-words w-fit ${
                                isMe
                                  ? "rounded-2xl rounded-tr-sm text-white"
                                  : "rounded-2xl rounded-tl-sm"
                              }`}
                              style={
                                isMe
                                  ? {
                                      background: "var(--color-brand)",
                                      boxShadow: "0 2px 8px rgba(37,99,235,0.28)",
                                      maxWidth: "min(360px,68vw)",
                                    }
                                  : {
                                      background: "var(--color-surface-soft)",
                                      border: "1px solid var(--color-border)",
                                      boxShadow: "var(--shadow-sm)",
                                      maxWidth: "min(360px,68vw)",
                                    }
                              }
                            >
                              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {msg.content}
                              </p>
                              <p
                                className="text-[9px] mt-1 select-none"
                                style={{ textAlign: isMe ? "right" : "left", opacity: 0.6 }}
                              >
                                {formatTime(msg.created_at)}
                              </p>
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
          className="px-5 py-2 flex items-center gap-2 text-[11px] shrink-0"
          style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{(error as any)?.message || String(error)}</span>
        </div>
      )}

      {/* ── Input area ── */}
      <div
        className="shrink-0 px-4 py-4 border-t border-border-app"
        style={{ background: "var(--color-surface-soft)" }}
      >
        <form onSubmit={handleSend}>
          <div
            className={`flex items-end gap-2 border border-border-strong bg-surface-app px-5 py-3 transition-colors ${isMultiLine ? "rounded-2xl" : "rounded-full"}`}
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <Textarea
              ref={inputRef}
              aria-label="Nhập nội dung tin nhắn"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLocked}
              placeholder={isLocked ? "Hết credit — mua thêm để tiếp tục trao đổi" : "Nhắn gì đó…"}
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
                  fontSize: 13,
                  lineHeight: "1.5",
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
              radius="xl"
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

        {isLocked && (
          <Alert color="red" variant="light" radius="md" className="mt-2">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Bạn đã hết credit. Mua thêm để tiếp tục trao đổi với supporter.</span>
            </div>
          </Alert>
        )}

        
      </div>
    </div>
  );
}
