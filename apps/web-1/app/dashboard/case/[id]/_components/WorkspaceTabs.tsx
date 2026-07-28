"use client";

import React from "react";
import { FileText, FileSpreadsheet, MessageSquare, History, Settings } from "lucide-react";

interface WorkspaceTabsProps {
  activeTab: "idea" | "report" | "discussion" | "timeline" | "settings";
  onTabChange: (tab: "idea" | "report" | "discussion" | "timeline" | "settings") => void;
  messageCount?: number;
  hideSettings?: boolean;
}

export default function WorkspaceTabs({ activeTab, onTabChange, messageCount, hideSettings = false }: WorkspaceTabsProps) {
  const tabs = [
    {
      id: "idea" as const,
      label: "Ý tưởng nộp",
      icon: FileSpreadsheet,
    },
    {
      id: "report" as const,
      label: "Báo cáo phản biện",
      icon: FileText,
    },
    {
      id: "discussion" as const,
      label: "Trao đổi & Phản hồi",
      icon: MessageSquare,
      count: messageCount,
    },
    {
      id: "timeline" as const,
      label: "Lịch sử hoạt động",
      icon: History,
    },
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
    <div className="border-b border-border-app bg-surface-app rounded-t-2xl px-6 pt-3 shadow-sm flex flex-wrap gap-2 sm:gap-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold font-body border-b-2 transition-all cursor-pointer relative ${
              isActive
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-app hover:border-border-strong"
            }`}
          >
            <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-brand" : "text-text-subtle"}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 ml-1 text-xs font-semibold leading-none bg-brand text-white rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
