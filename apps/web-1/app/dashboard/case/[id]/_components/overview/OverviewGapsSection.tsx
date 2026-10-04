"use client";

import type { OverviewArea } from "./caseOverviewModel";

interface OverviewGapsSectionProps {
  verdictLabel: string | null;
  areas: OverviewArea[];
  teamGaps: string[];
  commercialGaps: string[];
}

export default function OverviewGapsSection({
  verdictLabel,
  areas,
  teamGaps,
  commercialGaps,
}: OverviewGapsSectionProps) {
  const hasJudgement = Boolean(verdictLabel) || areas.length > 0;

  if (!hasJudgement && teamGaps.length === 0 && commercialGaps.length === 0) return null;

  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      <div className="pb-2.5 border-b border-border-app/60">
        <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
          Đánh giá sơ bộ hồ sơ
        </h3>
      </div>

      {verdictLabel && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-medium text-text-muted">Kết luận sơ bộ:</span>
          <span className="font-semibold text-text-app">{verdictLabel}</span>
        </div>
      )}

      {areas.length > 0 && (
        <div className="space-y-3">
          {areas.map((area) => (
            <div key={area.ten} className="bg-surface-soft/40 border border-border-app/60 rounded-lg p-4 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-medium rounded-full px-2 py-0.5 border ${
                    area.isWeak
                      ? "bg-danger-soft text-danger border-danger/20"
                      : "bg-success-soft text-success border-success/20"
                  }`}
                >
                  {area.trangThaiLabel}
                </span>
                <span className="text-sm font-semibold text-text-app">{area.ten}</span>
                <span className="text-xs text-text-muted">Mức độ: {area.mucDoLabel}</span>
              </div>
              <p className="text-sm font-normal text-text-app leading-relaxed">{area.lyDo}</p>
              <p className="text-xs text-text-muted italic leading-relaxed">Dẫn chứng: {area.danChung}</p>
            </div>
          ))}
        </div>
      )}

      {(teamGaps.length > 0 || commercialGaps.length > 0) && (
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
      )}
    </div>
  );
}
