"use client";

import { Drawer, Stack, UnstyledButton, Group, Text } from "@mantine/core";
import { WORKSPACE_NAV_ITEMS, type WorkspaceTabKey } from "./JourneySidebar";
import classes from "./JourneySidebar.module.css";

interface JourneyMobileNavProps {
  opened: boolean;
  onClose: () => void;
  activeTab: WorkspaceTabKey;
  onTabChange: (key: WorkspaceTabKey) => void;
}

export default function JourneyMobileNav({
  opened,
  onClose,
  activeTab,
  onTabChange,
}: JourneyMobileNavProps) {
  const handleSelect = (key: WorkspaceTabKey) => {
    onTabChange(key);
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Menu dự án"
      size="xs"
      classNames={{ header: classes.mobileDrawerHeader, body: classes.mobileDrawerBody }}
    >
      <Stack gap={4} py="sm">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <UnstyledButton
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={isActive ? classes.mobileNavButtonActive : classes.mobileNavButton}
            >
              <Group gap="xs">
                {item.icon}
                <Text size="sm">{item.label}</Text>
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Drawer>
  );
}
