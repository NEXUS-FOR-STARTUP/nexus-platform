"use client";

interface OverviewGapsSectionProps {
  teamGaps: string[];
  commercialGaps: string[];
}

export default function OverviewGapsSection({
  teamGaps,
  commercialGaps,
}: OverviewGapsSectionProps) {
  if (teamGaps.length === 0 && commercialGaps.length === 0) return null;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      <div className="pb-2.5 border-b border-border-app/60">
        <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
          Đánh giá sơ bộ hồ sơ
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        {teamGaps.length > 0 && (
          <div className="bg-surface-soft/40 border border-border-app/60 rounded-lg p-4 space-y-2">
            <span className="text-xs font-medium text-text-muted block mb-1">
              Khoảng trống đội ngũ cần lưu ý:
            </span>
            <ul className="space-y-2 text-sm font-normal text-text-app leading-relaxed">
              {teamGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0 select-none">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {commercialGaps.length > 0 && (
          <div className="bg-surface-soft/40 border border-border-app/60 rounded-lg p-4 space-y-2">
            <span className="text-xs font-medium text-text-muted block mb-1">
              Khoảng trống thương mại & thị trường:
            </span>
            <ul className="space-y-2 text-sm font-normal text-text-app leading-relaxed">
              {commercialGaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0 select-none">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
