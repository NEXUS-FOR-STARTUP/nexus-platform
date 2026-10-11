"use client";

import { Stack, UnstyledButton, Text, Box } from "@mantine/core";
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
  { key: "overview", label: "Tổng quan dự án", icon: <LayoutDashboard size={19} /> },
  { key: "journey", label: "Hành trình", icon: <Compass size={19} /> },
  { key: "billing", label: "Lượt chấm & thanh toán", icon: <CreditCard size={19} /> },
  { key: "timeline", label: "Lịch sử hoạt động", icon: <History size={19} /> },
  { key: "settings", label: "Cài đặt", icon: <Settings size={19} /> },
];

interface JourneySidebarProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

export default function JourneySidebar({ activeTab, onTabChange }: JourneySidebarProps) {
  return (
    <Box component="nav" aria-label="Menu không gian dự án" className={classes.sidebarCard}>
      <Stack gap={4}>
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <UnstyledButton
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={classes.item}
              data-active={isActive ? true : undefined}
            >
              <span className={classes.iconWrapper}>{item.icon}</span>
              <Text size="sm">{item.label}</Text>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}
