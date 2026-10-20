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
      <aside className={classes.side}>
        <SettingsSidebar basePath={basePath} />
      </aside>

      <main className={classes.main}>
        <div className={classes.head}>
          <h1 className={classes.headTitle}>Cài đặt</h1>
          <p className={classes.headNote}>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>
        {children}
      </main>

      <button
        type="button"
        className={classes.burger}
        onClick={() => setDrawerOpen(true)}
        aria-label="Mở menu"
        aria-expanded={drawerOpen}
      >
        <Menu size={22} weight="bold" />
      </button>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Cài đặt tài khoản"
        padding="md"
        size="320px"
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
