"use client";

import { Button } from "@mantine/core";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: 0 | 1 | 2;
  canProceedToStep1: boolean;
  membersCount: number;
  onBack: () => void;
  onNextFromStep0: () => void;
  onEvaluate: () => void;
}

export default function NavigationButtons({
  currentStep,
  canProceedToStep1,
  membersCount,
  onBack,
  onNextFromStep0,
  onEvaluate,
}: NavigationButtonsProps) {
  if (currentStep >= 2) return null;

  return (
    <div className="flex items-center justify-between">
      <Button
        onClick={onBack}
        disabled={currentStep === 0}
        variant="default"
        leftSection={<ArrowLeft className="w-4 h-4" />}
        className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-xs"
      >
        Quay lại
      </Button>

      {currentStep === 0 ? (
        <Button
          onClick={onNextFromStep0}
          disabled={!canProceedToStep1}
          color="brand"
          rightSection={<ArrowRight className="w-4 h-4" />}
          className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-xs"
        >
          Tiếp tục
        </Button>
      ) : (
        <Button
          onClick={onEvaluate}
          disabled={membersCount === 0}
          color="brand"
          rightSection={<Sparkles className="w-4 h-4" />}
          className="font-body font-semibold cursor-pointer h-10 px-4 rounded-xl text-xs"
        >
          Đánh giá
        </Button>
      )}
    </div>
  );
}
