"use client";

import { Box, Stack } from "@mantine/core";
import { LayoutDashboard, Compass, CreditCard, History, Settings } from "lucide-react";
import type { ReactNode } from "react";
import classes from "./JourneySidebar.module.css";

export type WorkspaceTabKey = "overview" | "journey" | "billing" | "timeline" | "settings";

interface NavItem {
  key: WorkspaceTabKey;
  label: string;
  icon: ReactNode;
}

export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Tổng quan dự án", icon: <LayoutDashboard size={20} /> },
  { key: "journey", label: "Hành trình", icon: <Compass size={20} /> },
  { key: "billing", label: "Lượt chấm & thanh toán", icon: <CreditCard size={20} /> },
  { key: "timeline", label: "Lịch sử hoạt động", icon: <History size={20} /> },
  { key: "settings", label: "Cài đặt", icon: <Settings size={20} /> },
];

interface JourneySidebarProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

export default function JourneySidebar({ activeTab, onTabChange }: JourneySidebarProps) {
  return (
    <Box component="nav" aria-label="Menu không gian dự án" className={classes.navbar}>
      <Stack gap="xs">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <a
              key={item.key}
              className={classes.link}
              data-active={isActive ? true : undefined}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onTabChange(item.key);
              }}
            >
              <span className={classes.linkIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </Stack>
    </Box>
  );
}
