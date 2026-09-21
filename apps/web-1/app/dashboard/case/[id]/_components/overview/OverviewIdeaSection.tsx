"use client";

interface OverviewIdeaSectionProps {
  field: string;
  targetCustomer: string;
  problem: string;
  solution: string;
  mvp?: string;
}

export default function OverviewIdeaSection({
  field,
  targetCustomer,
  problem,
  solution,
  mvp,
}: OverviewIdeaSectionProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      <div className="pb-2.5 border-b border-border-app/60">
        <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
          Ý tưởng khởi nghiệp
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-text-muted text-xs font-medium block mb-0.5">Lĩnh vực hoạt động:</span>
          <p className="font-normal text-text-app mt-0.5 leading-relaxed text-sm">{field}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs font-medium block mb-0.5">Khách hàng mục tiêu:</span>
          <p className="font-normal text-text-app mt-0.5 leading-relaxed text-sm">{targetCustomer}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs font-medium block mb-0.5">Vấn đề cốt lõi:</span>
          <p className="font-normal text-text-app mt-0.5 leading-relaxed text-sm">{problem}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs font-medium block mb-0.5">Giải pháp đề xuất:</span>
          <p className="font-normal text-text-app mt-0.5 leading-relaxed text-sm">{solution}</p>
        </div>
      </div>

      {mvp && (
        <div className="bg-surface-soft/40 border border-border-app/60 rounded-lg p-3.5">
          <span className="text-text-muted text-xs font-medium block mb-0.5">
            Sản phẩm khả thi tối thiểu (MVP):
          </span>
          <p className="font-normal text-text-app leading-relaxed text-sm">{mvp}</p>
        </div>
      )}
    </div>
  );
}
