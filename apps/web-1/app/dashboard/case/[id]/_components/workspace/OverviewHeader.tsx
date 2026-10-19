"use client";

import { Group, Text } from "@mantine/core";
import { CopyIconButton } from "@/components/ui/CopyIconButton";
import s from "./overview.module.css";

interface OverviewHeaderProps {
  teamName?: string;
  caseCode?: string;
}

export default function OverviewHeader({ teamName, caseCode }: OverviewHeaderProps) {
  return (
    <div>
      <h1 className={s.title}>Tổng quan dự án</h1>
      <Text className={s.note}>{teamName ?? "Dự án của bạn"}</Text>
      {caseCode && (
        <Group gap={4}>
          <Text className={s.note}>Mã dự án: {caseCode}</Text>
          <CopyIconButton value={caseCode} label="Sao chép mã dự án" />
        </Group>
      )}
    </div>
  );
}
