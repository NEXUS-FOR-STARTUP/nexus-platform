import { Skeleton } from "@mantine/core";

const FIELD_ROWS = 3;

/** Loading shape of a settings form: heading, a few labelled fields and the save button. */
export default function SettingsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Đang tải cài đặt">
      <div className="space-y-2">
        <Skeleton height={24} width={200} radius="sm" />
        <Skeleton height={14} width="60%" radius="sm" />
      </div>
      {Array.from({ length: FIELD_ROWS }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height={14} width={120} radius="sm" />
          <Skeleton height={40} radius="md" />
        </div>
      ))}
      <Skeleton height={40} width={140} radius="md" />
    </div>
  );
}
