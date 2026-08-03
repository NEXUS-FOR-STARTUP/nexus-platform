"use client";

import { useState } from "react";
import { Popover, Text, UnstyledButton, Divider } from "@mantine/core";
import { Database, Trash2 } from "lucide-react";

export type PresetOption = {
  label: string;
  description?: string;
  data: unknown;
};

type Props = {
  presets: PresetOption[];
  onSelect: (data: unknown) => void;
  onClear?: () => void;
};

export default function DemoDataFAB({ presets, onSelect, onClear }: Props) {
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="top-end"
      offset={12}
      shadow="md"
      radius="md"
      width={260}
    >
      <Popover.Target>
        <UnstyledButton
          onClick={() => setOpened((o) => !o)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand/90 hover:scale-105 transition-all cursor-pointer"
          title="Demo: Điền dữ liệu mẫu"
        >
          <Database className="h-5 w-5" />
        </UnstyledButton>
      </Popover.Target>

      <Popover.Dropdown className="p-2 space-y-1">
        <Text size="xs" fw={600} c="dimmed" className="px-2 pb-1">
          Dữ liệu demo
        </Text>
        {presets.map((preset) => (
          <UnstyledButton
            key={preset.label}
            onClick={() => {
              onSelect(preset.data);
              setOpened(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-soft transition-colors cursor-pointer"
          >
            <Text size="sm" fw={500} className="text-text-app">
              {preset.label}
            </Text>
            {preset.description && (
              <Text size="xs" c="dimmed" className="mt-0.5">
                {preset.description}
              </Text>
            )}
          </UnstyledButton>
        ))}
        {onClear && (
          <>
            <Divider my={4} />
            <UnstyledButton
              onClick={() => {
                onClear();
                setOpened(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <Text size="sm" fw={500}>
                Xóa dữ liệu
              </Text>
            </UnstyledButton>
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
