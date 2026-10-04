"use client";

interface OverviewSupportSectionProps {
  currentBlocker?: string;
  primaryNeedText?: string;
  expectedOutputs?: string;
  extraNotes?: string;
}

export default function OverviewSupportSection({
  currentBlocker,
  primaryNeedText,
  expectedOutputs,
  extraNotes,
}: OverviewSupportSectionProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-xl p-5 space-y-4">
      <div className="pb-2.5 border-b border-border-app/60">
        <h3 className="font-heading text-base font-semibold text-text-app tracking-tight">
          Nhu cầu hỗ trợ & Trọng tâm tháo gỡ
        </h3>
      </div>

      <div className="space-y-4 text-sm">
        {currentBlocker && (
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-medium block mb-0.5">
              Điểm kẹt hiện tại của nhóm:
            </span>
            <p className="text-text-app text-sm leading-relaxed font-normal">
              {currentBlocker}
            </p>
          </div>
        )}

        <div>
          <span className="text-text-muted text-xs font-medium block mb-0.5">
            Nhu cầu hỗ trợ chính:
          </span>
          <p className="font-normal text-text-app mt-0.5 text-sm leading-relaxed">
            {primaryNeedText || "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-border-app/40">
          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">
              Kết quả mong đợi sau phản biện:
            </span>
            <p className="font-normal text-text-app text-sm leading-relaxed mt-0.5">
              {expectedOutputs || "Chưa nhập ghi chú kỳ vọng"}
            </p>
          </div>

          <div>
            <span className="text-text-muted text-xs font-medium block mb-0.5">
              Ghi chú thêm cho người hỗ trợ:
            </span>
            <p className="font-normal text-text-app text-sm leading-relaxed mt-0.5">
              {extraNotes || "Chưa nhập ghi chú thêm"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
