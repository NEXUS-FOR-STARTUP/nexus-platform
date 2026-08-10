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
    <div className="flex items-center justify-between">
      <Button
        onClick={onBack}
        disabled={currentStep === 0}
        variant="default"
        leftSection={<ArrowLeft className="w-4 h-4" />}
        className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-base"
      >
        Quay lại
      </Button>

      <div className="flex items-center gap-2">
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            color="red"
            leftSection={<RotateCcw className="w-4 h-4" />}
            className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-base border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Đặt lại
          </Button>
        )}
        {currentStep === 0 ? (
          <Button
            onClick={onNextFromStep0}
            disabled={!canProceedToStep1}
            color="brand"
            rightSection={<ArrowRight className="w-4 h-4" />}
            className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-base"
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            onClick={onEvaluate}
            disabled={membersCount === 0}
            color="brand"
            rightSection={<Sparkles className="w-4 h-4" />}
            className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-base"
          >
            Đánh giá
          </Button>
        )}
      </div>
    </div>
  );
}
