import { Skeleton } from "@mantine/core";
import GuidedEditorSkeleton from "../guided-documents/GuidedEditorSkeleton";

const PANEL_BLOCKS = 3;

/** Fallback while a lazy tab (billing, timeline, settings) downloads: heading plus stacked blocks. */
export function TabPanelSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton height={30} width={240} radius="sm" />
      {Array.from({ length: PANEL_BLOCKS }, (_, i) => (
        <Skeleton key={i} height={96} radius="md" />
      ))}
    </div>
  );
}

/** Fallback while the stage detail downloads: stage header then the 3-pane editor grid. */
export function StageDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton height={14} width={80} radius="sm" />
        <Skeleton height={30} width={260} radius="sm" />
      </div>
      <GuidedEditorSkeleton />
    </div>
  );
}
