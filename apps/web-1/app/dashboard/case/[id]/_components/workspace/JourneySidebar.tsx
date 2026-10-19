"use client";

import type { ReactNode } from "react";
import { Compass, CreditCard, History, Settings, LayoutDashboard, HelpCircle, ExternalLink } from "lucide-react";
import { ZALO_GROUP_URL } from "@/lib/zalo";
import classes from "./JourneySidebar.module.css";

export type WorkspaceTabKey = "overview" | "journey" | "billing" | "timeline" | "settings";

interface NavItem {
  key: WorkspaceTabKey;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Tổng quan dự án", icon: <LayoutDashboard className={classes.linkIcon} /> },
  { key: "journey", label: "Hành trình", icon: <Compass className={classes.linkIcon} /> },
  { key: "billing", label: "Lượt chấm & thanh toán", icon: <CreditCard className={classes.linkIcon} /> },
  { key: "timeline", label: "Lịch sử hoạt động", icon: <History className={classes.linkIcon} /> },
  { key: "settings", label: "Cài đặt", icon: <Settings className={classes.linkIcon} /> },
];

interface WorkspaceNavLinksProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

/** Danh sách mục + chân Zalo dùng chung cho sidebar desktop và ngăn kéo mobile. */
export function WorkspaceNavLinks({ activeTab, onTabChange }: WorkspaceNavLinksProps) {
  return (
    <>
      <div className={classes.navbarMain}>
        {NAV_ITEMS.map((item) => (
          <a
            className={classes.link}
            data-active={activeTab === item.key || undefined}
            aria-current={activeTab === item.key ? "page" : undefined}
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
        ))}
      </div>

      <div className={classes.footer}>
        <a href={ZALO_GROUP_URL} target="_blank" rel="noopener noreferrer" className={classes.link}>
          <HelpCircle className={classes.linkIcon} />
          <span>Hỗ trợ Zalo</span>
          <ExternalLink size={14} className={classes.external} />
        </a>
      </div>
    </>
  );
}

export default function JourneySidebar(props: WorkspaceNavLinksProps) {
  return (
    <nav className={classes.navbar} aria-label="Điều hướng dự án">
      <WorkspaceNavLinks {...props} />
    </nav>
  );
}
