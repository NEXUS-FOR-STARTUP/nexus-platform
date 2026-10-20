"use client";

import { useEffect } from "react";
import { Drawer } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { WorkspaceNavLinks, type WorkspaceTabKey } from "./JourneySidebar";
import classes from "./JourneySidebar.module.css";

interface JourneyMobileNavProps {
  opened: boolean;
  onClose: () => void;
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

// Phải khớp breakpoint trong workspace-layout.module.css.
const DESKTOP_QUERY = "(min-width: 821px)";

export default function JourneyMobileNav({ opened, onClose, activeTab, onTabChange }: JourneyMobileNavProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY, false, { getInitialValueInEffect: true });

  // Phóng to cửa sổ khi ngăn kéo đang mở: sidebar cố định thay thế, nên đóng ngăn kéo.
  useEffect(() => {
    if (isDesktop && opened) onClose();
  }, [isDesktop, opened, onClose]);

  const handleSelect = (key: WorkspaceTabKey) => {
    onTabChange(key);
    onClose();
  };

  return (
    <Drawer opened={opened} onClose={onClose} title="Menu dự án" size="min(320px, 85vw)">
      <nav className={classes.drawerBody} aria-label="Điều hướng dự án">
        <WorkspaceNavLinks activeTab={activeTab} onTabChange={handleSelect} />
      </nav>
    </Drawer>
  );
}
