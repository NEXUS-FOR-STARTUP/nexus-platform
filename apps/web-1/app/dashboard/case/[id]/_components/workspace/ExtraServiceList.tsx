"use client";

import { Paper, Stack, Group, Text, Badge } from "@mantine/core";
import { Users2 } from "lucide-react";

export default function ExtraServiceList() {
  return (
    <Stack gap="xs" mt="md">
      <Text fw={600} size="sm">Dịch vụ bổ trợ</Text>
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm">
            <Users2 size={20} className="text-gray-600" />
            <Stack gap={2}>
              <Text fw={500} size="sm">Đánh giá đội ngũ (Team Fit)</Text>
              <Text size="xs" c="dimmed">
                Báo cáo phân tích mức độ phù hợp và điểm mạnh/yếu của các thành viên sáng lập.
              </Text>
            </Stack>
          </Group>
          <Badge color="green" variant="light" size="sm">Miễn phí</Badge>
        </Group>
      </Paper>
    </Stack>
  );
}
