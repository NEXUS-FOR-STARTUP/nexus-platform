"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Drawer } from "@mantine/core";
import { List as Menu } from "@phosphor-icons/react";
import SettingsSidebar from "./SettingsSidebar";
import classes from "../settings.module.css";

export default function SettingsLayout({
  children,
  basePath = "/dashboard/settings",
}: {
  children: ReactNode;
  basePath?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={classes.layout}>
      <header className={classes.header}>
        <h1 className={classes.title}>Cài đặt</h1>
        <p className={classes.note}>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
      </header>

      <div className={classes.body}>
        <div className={classes.desktopNav}>
          <SettingsSidebar basePath={basePath} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile Drawer Navigation (Matching Mockup Drawer Pattern) */}
      <button
        type="button"
        className={classes.mobileBurger}
        onClick={() => setDrawerOpen(true)}
        aria-label="Mở menu cài đặt"
        aria-expanded={drawerOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Cài đặt tài khoản"
        padding="md"
        size="280px"
      >
        <div className={classes.drawerContent}>
          <SettingsSidebar
            basePath={basePath}
            onItemClickAction={() => setDrawerOpen(false)}
          />
        </div>
      </Drawer>
    </div>
  );
}
