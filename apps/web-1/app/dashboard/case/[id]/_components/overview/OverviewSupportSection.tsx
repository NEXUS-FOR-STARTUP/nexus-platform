"use client";

import type { OverviewData } from "./caseOverviewData";
import OverviewCard from "./OverviewCard";
import OverviewField from "./OverviewField";

export default function OverviewSupportSection({ data: d }: { data: OverviewData }) {
  if (!(d.currentBlocker || d.primaryNeedText || d.expectedOutputs || d.extraNotes)) return null;

  return (
    <OverviewCard title="Nhu cầu hỗ trợ & Trọng tâm tháo gỡ">
      <div className="space-y-4">
        {d.currentBlocker && (
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5">
            <OverviewField label="Điểm kẹt hiện tại của nhóm" value={d.currentBlocker} />
          </div>
        )}
        <OverviewField label="Nhu cầu hỗ trợ chính" value={d.primaryNeedText} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OverviewField label="Kết quả mong đợi sau phản biện" value={d.expectedOutputs} />
          <OverviewField label="Ghi chú thêm cho người hỗ trợ" value={d.extraNotes} />
        </div>
      </div>
    </OverviewCard>
  );
}
