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
  { key: "overview", label: "Tổng quan dự án", icon: <LayoutDashboard size={18} /> },
  { key: "journey", label: "Hành trình", icon: <Compass size={18} /> },
  { key: "billing", label: "Lượt chấm & thanh toán", icon: <CreditCard size={18} /> },
  { key: "timeline", label: "Lịch sử hoạt động", icon: <History size={18} /> },
  { key: "settings", label: "Cài đặt", icon: <Settings size={18} /> },
];

interface JourneySidebarProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

export default function JourneySidebar({ activeTab, onTabChange }: JourneySidebarProps) {
  return (
    <Box component="nav" aria-label="Menu không gian dự án" className={classes.sidebar}>
      <Stack gap={6}>
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <UnstyledButton
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={classes.item}
              data-active={isActive ? true : undefined}
            >
              {item.icon}
              <Text size="sm">{item.label}</Text>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  );
}
