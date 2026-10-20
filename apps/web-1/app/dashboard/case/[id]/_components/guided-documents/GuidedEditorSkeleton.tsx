import { Skeleton } from "@mantine/core";
import s from "./guided-editor.module.css";

const TOC_ROWS = 6;
const HINT_LINES = 4;

/** Loading shape of the guided editor: table of contents, question card and hint panel in the real 3-pane grid. */
export default function GuidedEditorSkeleton() {
  return (
    <div className={s.layout} role="status" aria-busy="true" aria-label="Đang tải biểu mẫu hướng dẫn">
      <div className={`${s.toc} space-y-2`}>
        {Array.from({ length: TOC_ROWS }, (_, i) => (
          <Skeleton key={i} height={34} radius="md" />
        ))}
      </div>
      <div className={`${s.card} space-y-4`}>
        <Skeleton height={22} width="70%" radius="sm" />
        <Skeleton height={14} width="90%" radius="sm" />
        <Skeleton height={220} radius="md" />
        <Skeleton height={40} width={160} radius="md" />
      </div>
      <div className="space-y-3">
        <Skeleton height={20} width={120} radius="sm" />
        {Array.from({ length: HINT_LINES }, (_, i) => (
          <Skeleton key={i} height={12} radius="sm" width={i === HINT_LINES - 1 ? "55%" : "100%"} />
        ))}
      </div>
    </div>
  );
}
