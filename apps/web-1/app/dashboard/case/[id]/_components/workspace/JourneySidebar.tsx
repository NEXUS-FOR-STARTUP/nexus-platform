"use client";

import { Group, Text } from "@mantine/core";
import { LayoutDashboard, Compass, CreditCard, History, Settings, ExternalLink, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import classes from "./JourneySidebar.module.css";
import { ZALO_GROUP_URL } from "@/lib/zalo";

export type WorkspaceTabKey = "overview" | "journey" | "billing" | "timeline" | "settings";

interface NavItem {
  key: WorkspaceTabKey;
  label: string;
  icon: ReactNode;
}

export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Tổng quan dự án", icon: <LayoutDashboard className={classes.linkIcon} /> },
  { key: "journey", label: "Hành trình", icon: <Compass className={classes.linkIcon} /> },
  { key: "billing", label: "Lượt chấm & thanh toán", icon: <CreditCard className={classes.linkIcon} /> },
  { key: "timeline", label: "Lịch sử hoạt động", icon: <History className={classes.linkIcon} /> },
  { key: "settings", label: "Cài đặt", icon: <Settings className={classes.linkIcon} /> },
];

interface JourneySidebarProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

export default function JourneySidebar({ activeTab, onTabChange }: JourneySidebarProps) {
  const links = WORKSPACE_NAV_ITEMS.map((item) => (
    <a
      className={classes.link}
      data-active={activeTab === item.key || undefined}
      href="#"
      key={item.key}
      onClick={(event) => {
        event.preventDefault();
        onTabChange(item.key);
      }}
    >
      {item.icon}
      <span>{item.label}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <Text fw={700} size="sm" c="white">
            NEXUS WORKSPACE
          </Text>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        <a
          href={ZALO_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.link}
        >
          <HelpCircle className={classes.linkIcon} />
          <span>Hỗ trợ Zalo</span>
          <ExternalLink size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />
        </a>
      </div>
    </nav>
  );
}
