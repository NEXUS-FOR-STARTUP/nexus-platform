"use client";

import type { OverviewData } from "./caseOverviewData";
import OverviewCard from "./OverviewCard";
import OverviewField from "./OverviewField";

export default function OverviewIdeaSection({ data: d }: { data: OverviewData }) {
  if (!(d.field || d.targetCustomer || d.problem || d.solution || d.mvp)) return null;

  return (
    <OverviewCard title="Ý tưởng khởi nghiệp">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OverviewField label="Lĩnh vực hoạt động" value={d.field} />
        <OverviewField label="Khách hàng mục tiêu" value={d.targetCustomer} />
        <OverviewField label="Vấn đề cốt lõi" value={d.problem} />
        <OverviewField label="Giải pháp đề xuất" value={d.solution} />
      </div>
      {d.mvp && (
        <div className="bg-surface-soft/40 border border-border-app/60 rounded-lg p-3.5">
          <OverviewField label="Sản phẩm khả thi tối thiểu (MVP)" value={d.mvp} />
        </div>
      )}
    </OverviewCard>
  );
}
