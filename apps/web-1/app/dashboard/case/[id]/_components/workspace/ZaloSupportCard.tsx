"use client";

import { Paper, Group, Stack, Text, Button } from "@mantine/core";
import { MessageCircle, ExternalLink } from "lucide-react";

interface ZaloSupportCardProps {
  url?: string;
}

const DEFAULT_ZALO_URL = process.env.NEXT_PUBLIC_ZALO_GROUP_URL || "https://zalo.me/g/nexus-support";

export default function ZaloSupportCard({ url = DEFAULT_ZALO_URL }: ZaloSupportCardProps) {
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
