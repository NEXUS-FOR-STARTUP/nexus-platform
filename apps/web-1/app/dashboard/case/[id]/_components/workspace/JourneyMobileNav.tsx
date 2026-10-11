"use client";

import { Drawer, Stack, UnstyledButton, Group, Text } from "@mantine/core";
import { WORKSPACE_NAV_ITEMS, type WorkspaceTabKey } from "./JourneySidebar";

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
    <Drawer opened={opened} onClose={onClose} title="Menu dự án" size="xs">
      <Stack gap={4} py="sm">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <UnstyledButton
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={`w-full px-3 py-2.5 rounded-md text-sm ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
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
