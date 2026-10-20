import type { ReactNode } from "react";
import s from "./Notice.module.css";

export type NoticeKind = "ok" | "bad" | "info";

interface NoticeProps {
  kind: NoticeKind;
  title: string;
  children: ReactNode;
}

const KIND_CLASS: Record<NoticeKind, string> = { ok: s.ok, bad: s.bad, info: s.info };

export default function Notice({ kind, title, children }: NoticeProps) {
  return (
    <div className={`${s.notice} ${KIND_CLASS[kind]}`} role="status">
      <b className={s.title}>{title}</b>
      {children}
    </div>
  );
}
