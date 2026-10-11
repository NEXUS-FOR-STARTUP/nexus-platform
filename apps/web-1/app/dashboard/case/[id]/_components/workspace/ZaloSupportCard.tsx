"use client";

import { Paper, Group, Stack, Text, Button } from "@mantine/core";
import { MessageCircle, ExternalLink } from "lucide-react";
import { ZALO_GROUP_URL } from "@/lib/zalo";

interface ZaloSupportCardProps {
  url?: string;
}

export default function ZaloSupportCard({ url = ZALO_GROUP_URL }: ZaloSupportCardProps) {
  return (
    <Paper p="md" withBorder radius="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap="sm">
          <MessageCircle size={22} className="text-blue-600" />
          <Stack gap={2}>
            <Text fw={600} size="sm">Cần hỗ trợ trực tiếp?</Text>
            <Text size="xs" c="dimmed">Tham gia nhóm Zalo để được đội ngũ phản hồi nhanh trong 15 phút.</Text>
          </Stack>
        </Group>
        <Button
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          size="xs"
          variant="light"
          rightSection={<ExternalLink size={14} />}
        >
          Tham gia Zalo
        </Button>
      </Group>
    </Paper>
  );
}
