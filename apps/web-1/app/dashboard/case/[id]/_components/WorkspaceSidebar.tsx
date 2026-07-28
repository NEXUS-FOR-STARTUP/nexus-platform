"use client";

import React from "react";
import { Tooltip, UnstyledButton } from "@mantine/core";
import { FileText, MessageSquare, History, Settings, CreditCard } from "lucide-react";
import classes from "../../../../../components/layout/DoubleNavbar.module.css";

interface WorkspaceSidebarProps {
  activeTab: "documents" | "discussion" | "timeline" | "settings" | "credits";
  onTabChange: (tab: "documents" | "discussion" | "timeline" | "settings" | "credits") => void;
  messageCount?: number;
  creditBalance?: number;
  hideSettings?: boolean;
  hideCredits?: boolean;
}

export default function WorkspaceSidebar({
  activeTab,
  onTabChange,
  messageCount,
  creditBalance,
  hideSettings = false,
  hideCredits = false,
}: WorkspaceSidebarProps) {
  const tabs = [
    {
      id: "documents" as const,
      label: "Tài liệu",
      icon: FileText,
    },
    {
      id: "discussion" as const,
      label: "Chat với Supporter",
      icon: MessageSquare,
      count: messageCount,
    },
    {
      id: "timeline" as const,
      label: "Lịch sử hoạt động",
      icon: History,
    },
    ...(!hideCredits
      ? [
          {
            id: "credits" as const,
            label: "Quản lý số dư credit",
            icon: CreditCard,
            count: creditBalance,
          },
        ]
      : []),
    ...(!hideSettings
      ? [
          {
            id: "settings" as const,
            label: "Cấu hình",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <nav className={`${classes.navbar} ${classes.singleWidth}`}>
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
                  className={classes.mainLink}
                  data-active={isActive || undefined}
                >
                  <Icon className="w-5 h-5" />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-[9px] font-bold flex items-center justify-center border-2 ${
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
  );
}
