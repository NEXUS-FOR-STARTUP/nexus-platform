"use client";

import { Check, Loader2 } from "lucide-react";

export interface RadarStage {
  id: number;
  num: string;
  name: string;
  desc: string;
}

interface RadarStagePipelineProps {
  stages: RadarStage[];
  currentStep: number;
  status: string;
}

export default function RadarStagePipeline({
  stages,
  currentStep,
  status,
}: RadarStagePipelineProps) {
  return (
    <div
      className={`space-y-1 pt-1 ${
        stages.length > 5 ? "max-h-96 overflow-y-auto pr-1" : ""
      }`}
    >
      {stages.map((stage, index) => {
        const isDone = currentStep > stage.id || status === "completed";
        const isActive = currentStep === stage.id && status === "running";
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.id} className="relative flex items-start gap-3 group">
            {/* Connecting vertical line */}
            {!isLast && (
              <div
                className={`absolute left-[15px] top-[30px] bottom-[-4px] w-[2px] transition-colors ${
                  isDone
                    ? "bg-emerald-400 dark:bg-emerald-600"
                    : "bg-border-app"
                }`}
              />
            )}

            {/* Step node icon */}
            <div className="relative z-10 flex items-center justify-center shrink-0 mt-0.5">
              {isDone ? (
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </div>
              ) : isActive ? (
                <div className="w-8 h-8 rounded-full bg-brand-soft/40 dark:bg-brand/20 border-2 border-brand text-brand flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-muted/60 border border-border-app text-text-subtle font-mono text-xs font-semibold flex items-center justify-center">
                  {stage.num}
                </div>
              )}
            </div>

            {/* Step info card */}
            <div
              className={`flex-1 min-w-0 p-3 rounded-lg border transition-all mb-2.5 ${
                isActive
                  ? "bg-brand/5 dark:bg-brand/10 border-brand/30 ring-1 ring-brand/10"
                  : isDone
                    ? "bg-surface-app border-border-app"
                    : "bg-surface-soft/30 border-border-app opacity-80"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isActive
                        ? "text-brand"
                        : isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-text-subtle"
                    }`}
                  >
                    {stage.num}
                  </span>
                  <h4
                    className={`text-xs sm:text-sm font-semibold sm:truncate ${
                      isActive
                        ? "text-brand"
                        : isDone
                          ? "text-text-app"
                          : "text-text-muted"
                    }`}
                  >
                    {stage.name}
                  </h4>
                </div>

                {/* State Tag */}
                <div>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                      Hoàn thành
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand bg-brand-soft/40 border border-brand/20 px-2 py-0.5 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand" />
                      </span>
                      Đang xử lý
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-text-subtle bg-surface-muted/50 px-2 py-0.5 rounded-full border border-border-app">
                      Chờ thực hiện
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-1 text-xs text-text-muted line-clamp-2 sm:line-clamp-1 leading-relaxed">
                {stage.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
