"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { INTRO_BULLETS, INTRO_LEAD } from "../../_data/copy";

interface IntroStepProps {
  hasSaved: boolean;
  onStart: () => void;
  onResume: () => void;
}

export function IntroStep({ hasSaved, onStart, onResume }: IntroStepProps) {
  return (
    <div className="bg-surface-app border border-border-app rounded-[var(--ui-radius)] p-4 sm:p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-xl sm:text-2xl font-medium text-text-app leading-snug">
          Trước khi bắt đầu dự án
        </h1>
        <p className="font-body text-sm text-text-muted leading-relaxed max-w-[62ch]">{INTRO_LEAD}</p>
      </div>

      <div>
        <p className="font-heading text-sm font-medium text-text-app">Kết quả nhận được</p>
        <ul className="mt-2 space-y-2">
          {INTRO_BULLETS.map((line) => (
            <li key={line} className="flex gap-2.5">
              <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-brand" weight="bold" />
              <span className="font-body text-sm leading-relaxed text-text-app max-w-[62ch]">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-6 border-t border-border-app">
        <Button onClick={onStart} color="brand" size="sm" className="w-full sm:w-auto">
          Bắt đầu
        </Button>
        {hasSaved ? (
          <Button variant="default" size="sm" onClick={onResume} className="w-full sm:w-auto">
            Xem lại kết quả đã lưu
          </Button>
        ) : null}
        <Button component={Link} href="/dashboard/start/history" variant="subtle" color="gray" size="sm" className="w-full sm:w-auto sm:ml-auto">
          Lịch sử đánh giá
        </Button>
      </div>
    </div>
  );
}
