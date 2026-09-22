"use client";

import React, { useMemo, useState } from "react";
import { IntakeStep } from "../_types/intake.types";
import { Check, ChevronDown, ListOrdered } from "lucide-react";

interface IntakeProgressStepperProps {
  currentStep: IntakeStep;
  onStepClick?: (step: IntakeStep) => void;
  selectableSteps?: IntakeStep[];
  stepsList?: IntakeStep[];
}

const steps = [
  { step: IntakeStep.SITUATION, label: "Tình trạng hiện tại" },
  { step: IntakeStep.CONTACT, label: "Thông tin liên hệ" },
  { step: IntakeStep.PROJECT_CONTEXT, label: "Thông tin dự án" },
  { step: IntakeStep.SUPPORT_NEEDS, label: "Nhu cầu hỗ trợ" },
  { step: IntakeStep.DOCUMENTS, label: "Tải tài liệu" },
  { step: IntakeStep.BOUNDARY, label: "Phạm vi" },
  { step: IntakeStep.REVIEW, label: "Xác nhận & Nộp" },
];

export default function IntakeProgressStepper({
  currentStep,
  onStepClick,
  selectableSteps = [],
  stepsList,
}: IntakeProgressStepperProps) {
  const effectiveSteps = useMemo(() => {
    if (!stepsList || stepsList.length === 0) {
      return steps;
    }
    return stepsList
      .map((step) => steps.find((s) => s.step === step))
      .filter((s): s is { step: IntakeStep; label: string } => Boolean(s));
  }, [stepsList]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const currentStepIdx = effectiveSteps.findIndex((item) => item.step === currentStep);
  const activeStepItem = effectiveSteps[currentStepIdx] || effectiveSteps[0];
  const progressPercent =
    effectiveSteps.length > 1
      ? Math.round((Math.max(0, currentStepIdx) / (effectiveSteps.length - 1)) * 100)
      : 100;

  return (
    <>
      <div className="hidden lg:flex flex-col gap-2 w-full">
        {effectiveSteps.map((s, idx) => {
          const isActive = s.step === currentStep;
          const isCompleted = currentStepIdx !== -1 ? idx < currentStepIdx : s.step < currentStep;
          const isSelectable = selectableSteps.includes(s.step);
          return (
            <button
              key={idx}
              onClick={() => isSelectable && onStepClick?.(s.step)}
              disabled={!isSelectable}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left w-full transition-all duration-200 ${
                isActive
                  ? "bg-brand text-white border-brand shadow-sm font-semibold"
                  : isCompleted
                  ? "bg-brand-soft/20 hover:bg-brand-soft/40 border-brand/10 text-brand cursor-pointer"
                  : isSelectable
                  ? "bg-surface-app border-border-app hover:border-brand/40 hover:bg-surface-soft cursor-pointer text-text-app"
                  : "bg-surface-app/40 border-border-app/40 text-text-subtle opacity-65 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                  isActive
                    ? "bg-white text-brand"
                    : isCompleted
                    ? "bg-brand text-white"
                    : "bg-surface-muted text-text-subtle border border-border-app"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-heading font-semibold leading-tight block">{s.label}</span>
                <span className={`text-base leading-none mt-0.5 ${isActive ? "text-white/80" : "text-text-muted"}`}>
                  {isActive ? "Đang thực hiện" : isCompleted ? "Đã hoàn thành" : isSelectable ? "Sẵn sàng" : "Chưa mở khóa"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Compact Progress Bar (< lg) */}
      <div className="lg:hidden w-full border-b border-border-app bg-surface-app px-4 py-3 mb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {currentStepIdx >= 0 ? currentStepIdx + 1 : 1}
            </span>
            <div className="min-w-0">
              <div className="text-xs text-text-subtle font-medium">
                Bước {currentStepIdx >= 0 ? currentStepIdx + 1 : 1} / {effectiveSteps.length}
              </div>
              <div className="text-sm font-heading font-semibold text-text-app truncate">
                {activeStepItem?.label}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-border-app bg-surface-soft text-text-app text-xs font-medium shrink-0 hover:border-brand/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-expanded={isDropdownOpen}
            aria-controls="mobile-intake-step-list"
            aria-label="Danh sách các bước"
          >
            <ListOrdered className="w-4 h-4 text-text-muted" />
            <span>Các bước</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Linear Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến độ hoàn thành các bước"
          className="w-full bg-surface-soft h-1.5 rounded-full overflow-hidden"
        >
          <div
            className="bg-brand h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Collapsible Step Selector for Mobile */}
        {isDropdownOpen && (
          <div id="mobile-intake-step-list" className="pt-2 border-t border-border-app/60 flex flex-col gap-1.5 animate-in fade-in duration-150">
            {effectiveSteps.map((s, idx) => {
              const isActive = s.step === currentStep;
              const isCompleted = currentStepIdx !== -1 ? idx < currentStepIdx : s.step < currentStep;
              const isSelectable = selectableSteps.includes(s.step);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (isSelectable) {
                      onStepClick?.(s.step);
                      setIsDropdownOpen(false);
                    }
                  }}
                  disabled={!isSelectable}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center justify-between p-3 min-h-[44px] rounded-lg text-left text-xs transition-colors ${
                    isActive
                      ? "bg-brand text-white font-semibold"
                      : isCompleted
                      ? "bg-brand-soft/20 text-brand hover:bg-brand-soft/30 cursor-pointer"
                      : isSelectable
                      ? "bg-surface-soft text-text-app hover:bg-surface-muted cursor-pointer"
                      : "text-text-subtle opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        isActive
                          ? "bg-white text-brand"
                          : isCompleted
                          ? "bg-brand text-white"
                          : "bg-surface-muted text-text-subtle border border-border-app"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </div>
                  <span className="text-[11px] shrink-0 opacity-80">
                    {isActive ? "Đang làm" : isCompleted ? "Xong" : isSelectable ? "Chọn" : "Khóa"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
