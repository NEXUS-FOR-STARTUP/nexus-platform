import type { ReactNode } from "react";
import s from "./Notice.module.css";

export type NoticeKind = "ok" | "bad";

interface NoticeProps {
  kind: NoticeKind;
  title: string;
  children: ReactNode;
}

export default function Notice({ kind, title, children }: NoticeProps) {
  return (
    <div className={`${s.notice} ${kind === "ok" ? s.ok : s.bad}`} role="status">
      <b className={s.title}>{title}</b>
      {children}
    </div>
  );
}
