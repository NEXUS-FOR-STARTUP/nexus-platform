"use client";

import React from "react";
import { IntakeStep } from "../_types/intake.types";
import { Check } from "lucide-react";

interface IntakeProgressStepperProps {
  currentStep: IntakeStep;
  onStepClick?: (step: IntakeStep) => void;
  selectableSteps?: IntakeStep[];
}

const steps = [
  { step: IntakeStep.SITUATION, label: "Tình huống" },
  { step: IntakeStep.CONTACT, label: "Liên hệ" },
  { step: IntakeStep.PROJECT_CONTEXT, label: "Bối cảnh dự án" },
  { step: IntakeStep.SUPPORT_NEEDS, label: "Nhu cầu hỗ trợ" },
  { step: IntakeStep.DOCUMENTS, label: "Tài liệu" },
  { step: IntakeStep.BOUNDARY, label: "Phạm vi" },
  { step: IntakeStep.REVIEW, label: "Xác nhận" },
];

export default function IntakeProgressStepper({
  currentStep,
  onStepClick,
  selectableSteps = [],
}: IntakeProgressStepperProps) {
  return (
    <>
      <div className="hidden lg:flex flex-col gap-2 w-full">
        {steps.map((s, idx) => {
          const isActive = s.step === currentStep;
          const isCompleted = s.step < currentStep;
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
                <span className="text-xs font-heading font-bold leading-tight block">{s.label}</span>
                <span className={`text-[10px] leading-none mt-0.5 ${isActive ? "text-white/80" : "text-text-muted"}`}>
                  {isActive ? "Đang thực hiện" : isCompleted ? "Đã hoàn thành" : isSelectable ? "Sẵn sàng" : "Chưa mở khóa"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="lg:hidden w-full py-3 border-b border-border-app bg-surface-app px-4 mb-4">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1">
          {steps.map((s, idx) => {
            const isActive = s.step === currentStep;
            const isCompleted = s.step < currentStep;
            const isSelectable = selectableSteps.includes(s.step);

            return (
              <button
                key={idx}
                onClick={() => isSelectable && onStepClick?.(s.step)}
                disabled={!isSelectable}
                className="flex items-center shrink-0 gap-1.5 focus:outline-none"
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors ${
                    isActive
                      ? "bg-brand text-white"
                      : isCompleted
                      ? "bg-brand text-white"
                      : "bg-surface-muted text-text-subtle border border-border-app"
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                </span>
                <span
                  className={`text-[11px] font-heading font-semibold whitespace-nowrap ${
                    isActive ? "text-brand font-bold" : isCompleted ? "text-text-app font-medium" : "text-text-subtle font-normal"
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && <span className="text-text-subtle/30 mx-1 text-[10px]">/</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
