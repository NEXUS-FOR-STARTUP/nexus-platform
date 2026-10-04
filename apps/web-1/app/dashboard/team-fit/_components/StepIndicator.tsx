'use client';

import { Check, Circle } from 'lucide-react';

const STEPS = ['Ý tưởng cốt lõi', 'Thành viên nhóm', 'Kết quả sơ bộ'];

interface StepIndicatorProps {
  currentStep: 0 | 1 | 2;
  onStepClick?: (step: 0 | 1 | 2) => void;
}

function StepDot({
  index,
  isCompleted,
  isActive,
}: {
  index: number;
  isCompleted: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className={[
        'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
        isActive && 'border-brand bg-brand text-white',
        isCompleted && 'border-green-500 bg-green-500 text-white',
        !isActive && !isCompleted && 'border-border-app bg-transparent text-text-muted',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isCompleted ? (
        <Check className="h-4 w-4" />
      ) : isActive ? (
        <span className="text-sm font-semibold leading-none">{index + 1}</span>
      ) : (
        <Circle className="h-4 w-4 opacity-40" />
      )}
    </div>
  );
}

function StepLabel({
  label,
  isCompleted,
  isActive,
}: {
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}) {
  return (
    <span
      className={[
        'text-xs sm:text-sm transition-colors text-balance leading-tight text-center sm:text-left',
        isActive && 'font-semibold text-text-app',
        isCompleted && 'text-text-muted',
        !isActive && !isCompleted && 'text-text-muted',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}

export default function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex w-full items-start sm:items-center justify-between gap-1 sm:gap-2 py-1">
      {STEPS.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isClickable = isCompleted && currentStep !== 2 && !!onStepClick;

        return (
          <div key={label} className="contents">
            <div
              className={[
                'flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-center sm:text-left',
                isClickable ? 'cursor-pointer hover:opacity-80' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (isClickable) {
                  onStepClick(index as 0 | 1 | 2);
                }
              }}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              <StepDot index={index} isCompleted={isCompleted} isActive={isActive} />
              <StepLabel label={label} isCompleted={isCompleted} isActive={isActive} />
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={[
                  'mt-4 sm:mt-0 h-0.5 flex-1 transition-colors min-w-3 sm:min-w-6',
                  index < currentStep ? 'bg-green-500' : 'bg-border-app',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
