"use client";

import { Button } from "@mantine/core";
import { ArrowLeft, ArrowRight, Sparkles, RotateCcw } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: 0 | 1 | 2;
  canProceedToStep1: boolean;
  membersCount: number;
  onBack: () => void;
  onNextFromStep0: () => void;
  onEvaluate: () => void;
  onReset?: () => void;
}

export default function NavigationButtons({
  currentStep,
  canProceedToStep1,
  membersCount,
  onBack,
  onNextFromStep0,
  onEvaluate,
  onReset,
}: NavigationButtonsProps) {
  if (currentStep >= 2) return null;

  return (
    <div className="flex items-center justify-between gap-2 w-full pt-2">
      <Button
        onClick={onBack}
        disabled={currentStep === 0}
        variant="default"
        leftSection={<ArrowLeft className="w-4 h-4 shrink-0" />}
        className="font-body font-semibold cursor-pointer h-10 px-3 sm:px-4 rounded-xl text-xs whitespace-nowrap shrink-0"
      >
        <span>Quay lại</span>
      </Button>

      <div className="flex items-center gap-2 shrink-0">
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            color="red"
            className="font-body font-semibold cursor-pointer h-10 px-3.5 sm:px-4 rounded-xl text-xs border-red-500 text-red-500 hover:bg-red-500/10 whitespace-nowrap shrink-0 justify-center"
            title="Đặt lại"
            aria-label="Đặt lại"
          >
            <span className="flex items-center justify-center gap-1.5">
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Đặt lại</span>
            </span>
          </Button>
        )}
        {currentStep === 0 ? (
          <Button
            onClick={onNextFromStep0}
            disabled={!canProceedToStep1}
            color="brand"
            rightSection={<ArrowRight className="w-4 h-4 shrink-0" />}
            className="font-body font-semibold cursor-pointer h-10 px-4 sm:px-5 rounded-xl text-xs whitespace-nowrap shrink-0 shadow-sm shadow-brand/10"
          >
            <span>Tiếp tục</span>
          </Button>
        ) : (
          <Button
            onClick={onEvaluate}
            disabled={membersCount === 0}
            color="brand"
            rightSection={<Sparkles className="w-4 h-4 shrink-0" />}
            className="font-body font-semibold cursor-pointer h-10 px-4 sm:px-5 rounded-xl text-xs whitespace-nowrap shrink-0 shadow-sm shadow-brand/10"
          >
            <span>Kiểm tra sơ bộ</span>
          </Button>
        )}
      </div>
    </div>
  );
}
