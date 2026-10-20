import { Skeleton } from "@mantine/core";
import classes from "./workspace-layout.module.css";

const NAV_ROWS = 5;
const STAGE_ROWS = 3;
const PROGRESS_SEGMENTS = 4;

/**
 * Loading shape of the case workspace: the sidebar and the Overview tab, using the same grid and width
 * classes as the real shell so content does not jump when data arrives.
 */
export default function WorkspaceSkeleton() {
  return (
    <div className={classes.layout} role="status" aria-busy="true" aria-label="Đang tải dự án">
      <div className={classes.sidebar}>
        <div className="space-y-2 px-3 py-4">
          {Array.from({ length: NAV_ROWS }, (_, i) => (
            <Skeleton key={i} height={36} radius="md" />
          ))}
        </div>
      </div>

      <div className={`${classes.main} ${classes.col}`}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton height={30} width={220} radius="sm" />
            <Skeleton height={16} width={180} radius="sm" />
          </div>

          <Skeleton height={120} radius="md" />

          <div className="space-y-3">
            <Skeleton height={20} width={90} radius="sm" />
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${PROGRESS_SEGMENTS}, 1fr)` }}>
              {Array.from({ length: PROGRESS_SEGMENTS }, (_, i) => (
                <Skeleton key={i} height={6} radius="xl" />
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {Array.from({ length: STAGE_ROWS }, (_, i) => (
              <Skeleton key={i} height={64} radius="md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
