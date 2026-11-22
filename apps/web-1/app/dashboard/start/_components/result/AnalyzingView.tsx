"use client";

import { useEffect, useMemo, useState } from "react";
import type { PreCp1Input } from "@repo/validation";
import styles from "./AnalyzingView.module.css";

const STEP_INTERVAL_MS = 2400;
const LONG_WAIT_SEC = 12;

interface AnalyzingViewProps {
  input: PreCp1Input;
  hasIdeaCheck: boolean;
}

function buildTaskStream(input: PreCp1Input, hasIdeaCheck: boolean): string[] {
  const memberCount = input.team.length;
  const assetCount = Object.values(input.assets).filter((v) => v.trim().length > 0).length;
  const fieldName = input.madlibs?.field?.trim();
  const targetCustomer = input.madlibs?.targetCustomer?.trim();

  const initialTasks = [
    `Đọc hồ sơ năng lực của ${memberCount} thành viên trong nhóm`,
    "Kiểm tra độ phủ 3 mảng việc cốt lõi: kỹ thuật, khách hàng và tài chính",
    assetCount > 0
      ? `Phân loại ${assetCount} nhóm tài nguyên và lợi thế sẵn có`
      : "Đánh giá phương án xuất phát từ con số 0 theo quỹ thời gian hiện tại",
    "Đối chiếu mạng lưới người quen và kênh tiếp cận khách hàng đầu tiên",
    "Kiểm tra mức độ phù hợp với ngân sách và mục tiêu của nhóm",
  ];

  const deepLoopTasks = [
    hasIdeaCheck && fieldName
      ? `Đối chiếu đặc thù lĩnh vực “${fieldName}” với năng lực hiện tại`
      : "Tìm các hướng triển khai ít rủi ro phù hợp với thế mạnh của nhóm",
    hasIdeaCheck && targetCustomer
      ? `Đánh giá khả năng tiếp cận nhóm khách “${targetCustomer}” trong 2 tuần đầu`
      : "Xác định tệp khách hàng dễ tiếp cận và ít tốn chi phí thử nghiệm nhất",
    "Rà soát các điểm nghẽn thường gặp khi triển khai bản thử nghiệm",
    "Phân tích khoảng trống vai trò và gợi ý vị trí cần bổ sung",
    "Kiểm tra các yếu tố nhạy cảm về vận hành, chi phí và tuân thủ",
    "Tổng hợp câu hỏi phản biện thực tế mà hội đồng thường đặt ra",
    "Sàng lọc phương án dự phòng nếu giả định ban đầu chưa khớp thị trường",
    "Chuẩn hóa nhận định và hoàn thiện báo cáo sơ bộ cho nhóm",
  ];

  return [...initialTasks, ...deepLoopTasks];
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AnalyzingView({ input, hasIdeaCheck }: AnalyzingViewProps) {
  const tasks = useMemo(() => buildTaskStream(input, hasIdeaCheck), [input, hasIdeaCheck]);
  const [cursor, setCursor] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCursor((prev) => prev + 1);
    }, STEP_INTERVAL_MS);

    const clockTimer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const activeTaskIndex = cursor < tasks.length ? cursor : 5 + ((cursor - 5) % (tasks.length - 5));

  return (
    <div
      className={`${styles.card} w-full max-w-xl rounded-[var(--ui-radius)] border border-border-app bg-surface-app p-6 sm:p-8 space-y-6`}
    >
      <span className={styles.corner} aria-hidden="true" />
      <span className={styles.corner} aria-hidden="true" />
      <span className={styles.corner} aria-hidden="true" />
      <span className={styles.corner} aria-hidden="true" />

      <div className="flex items-start justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold text-text-app leading-snug">
          Hệ thống đang phân tích hồ sơ nhóm
        </h2>
        <span className="flex shrink-0 items-center gap-2 rounded-md border border-border-app bg-surface-soft px-2 py-1 font-body text-xs font-medium text-text-app tabular-nums">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          {formatElapsed(elapsedSec)}
        </span>
      </div>

      <div className="flex items-start gap-3 min-h-14">
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <p
          key={activeTaskIndex}
          aria-live="polite"
          aria-atomic="true"
          className={`${styles.line} ${styles.caret} font-body text-base text-text-app leading-relaxed`}
        >
          {tasks[activeTaskIndex]}
        </p>
      </div>

      <div className={styles.track} aria-hidden="true">
        <div className={styles.runner} />
      </div>

      {elapsedSec >= LONG_WAIT_SEC ? (
        <p className="border-t border-border-app pt-4 font-body text-xs text-text-muted leading-relaxed">
          Quá trình phân tích sâu theo đặc thù nhóm và ngành có thể mất từ 30 giây đến 2 phút. Vui lòng giữ nguyên trang để nhận báo cáo đầy đủ.
        </p>
      ) : null}
    </div>
  );
}
