import type { ReactNode } from "react";
import s from "./PageHead.module.css";

interface PageHeadProps {
  title: string;
  /** Plain text, or text followed by inline controls (the overview puts the case-code chip here). */
  note?: ReactNode;
}

export default function PageHead({ title, note }: PageHeadProps) {
  return (
    <div className={s.head}>
      <h1 className={s.title}>{title}</h1>
      {note && <p className={s.note}>{note}</p>}
    </div>
  );
}
