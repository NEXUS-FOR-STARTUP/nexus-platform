"use client";

import React, { useState } from "react";
import { Tooltip, UnstyledButton } from "@mantine/core";
import { FileText, MessageCircle, History, Settings, CreditCard, Info, Award, ChevronLeft, ChevronRight } from "lucide-react";
import classes from "../../../../../components/layout/DoubleNavbar.module.css";

export type WorkspaceTab = "overview" | "documents" | "report" | "discussion" | "timeline" | "settings" | "credits";

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  unreadCount?: number;
  messageCount?: number;
  creditBalance?: number;
  hideSettings?: boolean;
  hideCredits?: boolean;
  stage?: string;
  isAiPackage?: boolean;
}
export default function WorkspaceSidebar({
  activeTab,
  onTabChange,
  unreadCount,
  messageCount,
  creditBalance,
  hideSettings = false,
  hideCredits = false,
  stage,
  isAiPackage = false,
}: WorkspaceSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPreSubmission = stage === "intake_pending" || stage === "intake_ready";
  const isIntakePending = stage === "intake_pending";

  const tabs = [
    {
      id: "overview" as const,
      label: "Tổng quan dự án",
      icon: Info,
    },
    ...(!isIntakePending
      ? [
          {
            id: "documents" as const,
            label: "Tài liệu",
            icon: FileText,
          },
        ]
      : []),
    ...(stage === "report_ready" || stage === "completed" || stage === "waiting_for_revision" || stage === "revision_submitted"
      ? [
          {
            id: "report" as const,
      label: "Báo cáo đánh giá",
            icon: Award,
          },
        ]
      : []),
    ...(!isPreSubmission && !isAiPackage
      ? [
          {
            id: "discussion" as const,
            label: "Thảo luận",
            icon: MessageCircle,
            count: unreadCount ?? messageCount,
          },
        ]
      : []),
    {
      id: "timeline" as const,
      label: "Lịch sử hoạt động",
      icon: History,
    },
    ...(!hideCredits
      ? [
          {
            id: "credits" as const,
            label: "Lượt đánh giá",
            icon: CreditCard,
            count: creditBalance,
          },
        ]
      : []),
    ...(!hideSettings
      ? [
          {
            id: "settings" as const,
            label: "Cài đặt",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <div className="relative shrink-0 flex items-stretch">
      <nav
        className={`${classes.navbar} ${classes.singleWidth} transition-all duration-300 ease-in-out ${
          isCollapsed ? "!w-0 !min-w-0 !flex-[0_0_0px] overflow-hidden opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className={classes.wrapper}>
          <aside className={classes.aside}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <Tooltip
                  key={tab.id}
                  label={tab.label}
                  position="right"
                  withArrow
                  disabled={typeof window !== "undefined" && window.innerWidth < 768}
                >
                  <UnstyledButton
                    onClick={() => onTabChange(tab.id)}
                    className={`relative ${classes.mainLink}`}
                    data-active={isActive || undefined}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-xs font-semibold flex items-center justify-center border-2 ${
                          isActive ? "bg-white text-brand border-brand" : "bg-brand text-white border-surface-app"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </UnstyledButton>
                </Tooltip>
              );
            })}
          </aside>
        </div>
      </nav>

      {/* Mấu gập chìm ở mép viền (Edge Tab Handle) với hit-slop chuẩn touch */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
        aria-expanded={!isCollapsed}
        className={`absolute top-14 sm:top-16 z-30 flex items-center justify-center w-5 sm:w-5.5 h-10 sm:h-9 bg-brand text-white border-y border-r border-white/20 rounded-r-md shadow-md cursor-pointer transition-all duration-300 ease-in-out hover:w-6 focus:outline-none before:absolute before:-inset-2.5 before:content-[''] ${
          isCollapsed ? "left-0" : "left-[56px] md:left-[100px]"
        }`}
        title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
      >
        {isCollapsed ? (
          <ChevronRight size={13} className="stroke-[2.5]" />
        ) : (
          <ChevronLeft size={13} className="stroke-[2.5]" />
        )}
      </button>
    </div>
  );
}
