"use client";

import React, { useState, useEffect } from "react";
import { Case } from "@/types";
import { statusThemeMap } from "@/types";
import { Clock, Users, Calendar, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Tooltip } from "@mantine/core";

interface CaseStatusHeaderProps {
  caseData: Case;
  versions: number[];
  selectedVersion: number;
  onVersionChange: (version: number) => void;
  onSelectTab?: (tab: any) => void;
}

export default function CaseStatusHeader({
  caseData,
  versions,
  selectedVersion,
  onVersionChange,
  onSelectTab,
}: CaseStatusHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user ? (session.user as typeof session.user & { role?: string }) : undefined;

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [timerColor, setTimerColor] = useState<string>("text-text-muted");

  const isPaused = caseData.internal_status === "need_clarification";

  const slaSource = caseData.sla_deadline_at || caseData.deadline;

  useEffect(() => {
    if (isPaused) {
      setTimeLeft("Đang chờ nhóm bổ sung thông tin");
      setTimerColor("text-warning");
      return;
    }

    if (!slaSource) {
      setTimeLeft("Chưa thiết lập");
      setTimerColor("text-text-subtle");
      return;
    }

    const targetDate = new Date(slaSource).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft("Quá hạn SLA");
        setTimerColor("text-danger font-bold");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = "";
      if (days > 0) timeString += `${days} ngày `;
      timeString += `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      setTimeLeft(timeString);

      // Alert style if under 4 hours
      if (diff < 4 * 60 * 60 * 1000) {
        setTimerColor("text-danger font-semibold animate-pulse");
      } else if (diff < 12 * 60 * 60 * 1000) {
        setTimerColor("text-warning font-semibold");
      } else {
        setTimerColor("text-brand font-semibold");
      }
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [slaSource, isPaused]);

  // Translate stage label
  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "intake":
        return "Thu thập thông tin";
      case "payment":
        return "Thanh toán dịch vụ";
      case "checkpoint_1":
        return "Checkpoint 1";
      case "checkpoint_2":
        return "Checkpoint 2";
      case "checkpoint_3":
        return "Checkpoint 3";
      default:
        return stage;
      }
    };

  const statusTheme = statusThemeMap[caseData.user_facing_stage] || {
    label: caseData.user_facing_stage,
    color: "default",
  };

  const badgeClass = {
    primary: "bg-brand-soft/30 text-brand border border-brand/20",
    secondary: "bg-info-soft text-info border border-info/20",
    success: "bg-success-soft text-success border border-success/20",
    warning: "bg-warning-soft text-warning border border-warning/20",
    danger: "bg-danger-soft text-danger border border-danger/20",
    default: "bg-surface-muted text-text-muted border border-border-app",
  }[statusTheme.color as "primary" | "secondary" | "success" | "warning" | "danger" | "default"] || "bg-surface-muted text-text-muted border border-border-app";

  const slaLabel = caseData.sla_deadline_at ? "Cam kết SLA:" : caseData.deadline ? "Hạn mong muốn:" : "";

  return (
    <div className="bg-surface-app border border-border-app rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      {/* Case Basic Info */}
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Hồ sơ phản biện
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip label="Xem tổng quan hồ sơ & ý tưởng khởi nghiệp" withArrow position="top">
              <h2
                onClick={() => onSelectTab?.("overview")}
                className="font-heading text-xl sm:text-2xl font-bold text-text-app hover:text-brand transition-colors cursor-pointer"
              >
                {caseData.case_code}
              </h2>
            </Tooltip>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold font-body shadow-xs border ${badgeClass}`}>
              {(caseData.user_facing_stage === "submitted" || 
                caseData.user_facing_stage === "under_review" || 
                caseData.user_facing_stage === "revision_submitted" ||
                caseData.user_facing_stage === "need_more_information") && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    statusTheme.color === "primary" ? "bg-brand" : 
                    statusTheme.color === "warning" ? "bg-warning" : "bg-text-muted"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    statusTheme.color === "primary" ? "bg-brand" : 
                    statusTheme.color === "warning" ? "bg-warning" : "bg-text-muted"
                  }`}></span>
                </span>
              )}
              {statusTheme.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-body text-text-muted">
          {caseData.team_name && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-text-subtle" />
              <span>Nhóm: <strong>{caseData.team_name}</strong></span>
            </div>
          )}
          {caseData.school && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-subtle">|</span>
              <span>Trường: <strong>{caseData.school}</strong></span>
            </div>
          )}
          {caseData.course_context && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-subtle">|</span>
              <span>Lớp/Môn: <strong>{caseData.course_context}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* SLA Timer & Version Selector */}
      <div className="flex flex-wrap md:flex-col items-start md:items-end gap-4 shrink-0 w-full md:w-auto">
        <div className="flex items-center gap-2 p-2 px-3 bg-surface-soft rounded-lg text-xs font-body">
          <Clock className="w-4 h-4 text-text-subtle" />
          <span className="text-text-muted mr-1.5">{slaLabel}</span>
          <span className={timerColor}>{timeLeft}</span>
          {isPaused && (
            <div className="w-2 h-2 rounded-full bg-warning animate-ping ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}
