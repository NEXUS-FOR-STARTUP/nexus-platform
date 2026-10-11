"use client";

import { Paper, Stack, Group, Text, Button } from "@mantine/core";
import { FolderGit2, Edit3 } from "lucide-react";
import type { Case } from "@/types";

interface ProfileSummaryCardProps {
  caseData?: Case;
  onEditProfile: () => void;
}

export default function ProfileSummaryCard({ caseData, onEditProfile }: ProfileSummaryCardProps) {
  return (
    <Paper p="md" withBorder radius="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Group gap="sm" align="flex-start">
          <FolderGit2 size={22} className="text-gray-600 mt-0.5" />
          <Stack gap={2}>
            <Text fw={600} size="sm">{caseData?.team_name || "Dự án"}</Text>
            <Text size="xs" c="dimmed">Mã hồ sơ: {caseData?.case_code || "—"}</Text>
            {caseData?.school && (
              <Text size="xs" c="dimmed">Trường: {caseData.school}</Text>
            )}
          </Stack>
        </Group>
        <Button
          size="xs"
          variant="default"
          leftSection={<Edit3 size={14} />}
          onClick={onEditProfile}
        >
          Cập nhật hồ sơ
        </Button>
      </Group>
    </Paper>
  );
}
